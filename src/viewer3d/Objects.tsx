"use client";

// Free-standing objects from the SceneModel (T-131, object-render spec): plinth + cutout and/or
// GLB model, clickable like frames. Each object gets its own Suspense boundary and ErrorBoundary
// (R2): a broken modelUrl keeps the cutout and never crashes the scene. A ready model cross-fades
// in over the cutout (600 ms, instant under reduced motion); without a cutout it fades in over a
// neutral placeholder. Galleries without objects render nothing here (SceneModel.objects is []).

import { Component, Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { SceneModel, SceneObject } from "@/lib/compile/types";
import { libraryEntry } from "@/lib/objects/library";
import { THEME } from "@/lib/theme";
import { CutoutMesh } from "./CutoutMesh";
import { noRaycast } from "./Frames";
import { MODEL_FADE_MS, MAX_MODEL_TRIANGLES, ModelMesh, HeavyModelPlaceholder } from "./ModelMesh";
import { Plinth, type PlinthTone } from "./Plinth";

export const OBJECT_SELECTION_RING_WIDTH = 0.02; // meters of Klein blue around the plinth
export const MODEL_FOOTPRINT_SLACK = 1.1; // model footprint may exceed the plinth by 10%

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  );
}

export function createObjectClickHandler(
  objectId: string,
  onObjectClick?: (objectId: string) => void,
) {
  if (!onObjectClick) return undefined;
  return (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onObjectClick(objectId);
  };
}

/** Plinth tone follows the room's look: dark presets get graphite so it doesn't glow. */
export function plinthToneForRoom(
  rooms: SceneModel["rooms"],
  roomId: string,
): PlinthTone {
  const room = rooms.find((r) => r.roomId === roomId);
  const preset = room?.atmosphere?.preset;
  return preset === "moonlit" || preset === "neon-bunker" ? "dark" : "light";
}

interface CutoutProps {
  imageUrl: string;
  aspect: number;
  depth: number;
}

function resolveContent(obj: SceneObject): {
  cutout: CutoutProps | null;
  modelUrl: string | null;
} {
  if (obj.render.kind === "cutout") {
    return {
      cutout: {
        imageUrl: obj.render.imageUrl,
        aspect: obj.render.aspect,
        depth: obj.render.depth,
      },
      modelUrl: null,
    };
  }
  if (obj.render.kind === "library") {
    return { cutout: null, modelUrl: libraryEntry(obj.render.libraryId)?.modelUrl ?? null };
  }
  return {
    cutout: obj.render.fallback
      ? {
          imageUrl: obj.render.fallback.imageUrl,
          aspect: obj.render.fallback.aspect,
          depth: obj.render.fallback.depth,
        }
      : null,
    modelUrl: obj.render.modelUrl,
  };
}

class ObjectErrorBoundary extends Component<{
  objectId: string;
  fallback: ReactNode;
  onError?: (objectId: string) => void;
  children: ReactNode;
}> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.(this.props.objectId);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ObjectItem({
  obj,
  tone,
  selected,
  editor,
  onObjectClick,
  onObjectError,
}: {
  obj: SceneObject;
  tone: PlinthTone;
  selected: boolean;
  editor: boolean;
  onObjectClick?: (objectId: string) => void;
  onObjectError?: (objectId: string) => void;
}) {
  // R3F hooks (useFrame/useThree/useGLTF) only run inside the Canvas on the client.
  // The static shell below is SSR-safe so tests can renderToString it.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { cutout, modelUrl } = resolveContent(obj);
  const handleClick = createObjectClickHandler(obj.objectId, onObjectClick);

  const plinthTop = obj.plinth.shape === "none" ? 0 : obj.plinth.height;
  // Placeholder width before anything resolves: square-ish, never wider than the plinth.
  const placeholderWidth = Math.min(obj.height, obj.plinth.size);
  const staticFallback = cutout ? (
    <CutoutMesh
      imageUrl={cutout.imageUrl}
      height={obj.height}
      aspect={cutout.aspect}
      depth={cutout.depth}
    />
  ) : (
    <mesh position={[0, obj.height / 2, 0]}>
      <boxGeometry args={[placeholderWidth, obj.height, 0.05]} />
      <meshStandardMaterial color="#e2e2de" roughness={0.9} />
    </mesh>
  );

  const ringInner = obj.plinth.size / 2 + 0.01;

  return (
    <group
      position={obj.base}
      rotation={[0, obj.rotationY, 0]}
      data-object-id={obj.objectId}
      onClick={handleClick}
    >
      {obj.plinth.shape !== "none" ? (
        <group position={[0, -plinthTop, 0]}>
          <Plinth
            shape={obj.plinth.shape}
            height={obj.plinth.height}
            size={obj.plinth.size}
            tone={tone}
          />
        </group>
      ) : null}
      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} raycast={noRaycast}>
          <ringGeometry args={[ringInner, ringInner + OBJECT_SELECTION_RING_WIDTH, 48]} />
          <meshBasicMaterial color={THEME.colors.accent} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      {!mounted || !modelUrl ? (
        staticFallback
      ) : (
        <ObjectLive
          obj={obj}
          cutout={cutout}
          modelUrl={modelUrl}
          editor={editor}
          staticFallback={staticFallback}
          onObjectError={onObjectError}
        />
      )}
    </group>
  );
}

/** Client-only live content: fade driver, Suspense model, error boundary. */
function ObjectLive({
  obj,
  cutout,
  modelUrl,
  editor,
  staticFallback,
  onObjectError,
}: {
  obj: SceneObject;
  cutout: CutoutProps | null;
  modelUrl: string;
  editor: boolean;
  staticFallback: ReactNode;
  onObjectError?: (objectId: string) => void;
}) {
  const [triangles, setTriangles] = useState<number | null>(null);
  const [fade, setFade] = useState(0);
  const invalidate = useThree((s) => s.invalidate);
  const warned = useRef(false);

  const modelReady = triangles !== null;
  const heavy = editor && modelReady && (triangles as number) > MAX_MODEL_TRIANGLES;

  // Drive the cross-fade once the model lands (demand loop: keep invalidating while fading).
  useFrame((_, delta) => {
    if (!modelReady || fade >= 1) return;
    if (prefersReducedMotion()) {
      setFade(1);
      return;
    }
    setFade((f) => Math.min(1, f + delta / (MODEL_FADE_MS / 1000)));
    invalidate();
  });

  useEffect(() => {
    if (modelReady) invalidate();
  }, [modelReady, invalidate]);

  const handleError = (id: string) => {
    if (!warned.current) {
      warned.current = true;
      console.warn(`[objects] model failed for ${id}; keeping fallback`);
    }
    onObjectError?.(id);
  };

  if (heavy) {
    return <HeavyModelPlaceholder height={obj.height} footprint={obj.plinth.size} />;
  }
  return (
    <>
      {fade < 1 ? (
        cutout ? (
          <CutoutMesh
            imageUrl={cutout.imageUrl}
            height={obj.height}
            aspect={cutout.aspect}
            depth={cutout.depth}
            opacity={modelReady ? 1 - fade : 1}
          />
        ) : (
          staticFallback
        )
      ) : null}
      <ObjectErrorBoundary
        objectId={obj.objectId}
        fallback={staticFallback}
        onError={handleError}
      >
        <Suspense fallback={null}>
          <ModelMesh
            modelUrl={modelUrl}
            height={obj.height}
            maxFootprint={obj.plinth.size * MODEL_FOOTPRINT_SLACK}
            opacity={fade}
            onLoaded={({ triangles: t }) => setTriangles(t)}
          />
        </Suspense>
      </ObjectErrorBoundary>
    </>
  );
}

export interface ObjectsProps {
  objects: SceneObject[];
  rooms: SceneModel["rooms"];
  onObjectClick?: (objectId: string) => void;
  /** Object to outline with the accent ring (Top-down/editor selection). */
  selectedObjectId?: string;
  /** Editor-only behaviors: the over-budget kraft guard. */
  editor?: boolean;
  onObjectError?: (objectId: string) => void;
}

export function Objects({
  objects,
  rooms,
  onObjectClick,
  selectedObjectId,
  editor = false,
  onObjectError,
}: ObjectsProps) {
  return (
    <group>
      {objects.map((obj) => (
        <ObjectItem
          key={obj.objectId}
          obj={obj}
          tone={plinthToneForRoom(rooms, obj.roomId)}
          selected={obj.objectId === selectedObjectId}
          editor={editor}
          onObjectClick={onObjectClick}
          onObjectError={onObjectError}
        />
      ))}
    </group>
  );
}
