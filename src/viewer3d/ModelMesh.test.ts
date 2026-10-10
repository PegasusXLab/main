import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { normalizeObjectModel } from "./ModelMesh";

function boxModel(): THREE.Group {
  // A 2 x 4 x 1 box floating off-origin, like a raw Polycam export.
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 4, 1),
    new THREE.MeshStandardMaterial({ envMapIntensity: 3 }),
  );
  mesh.position.set(5, 10, -3);
  group.add(mesh);
  return group;
}

describe("normalizeObjectModel (T-131)", () => {
  it("scales to the requested height with the bottom at y = 0, centered horizontally", () => {
    const { object } = normalizeObjectModel(boxModel(), 1.0, 10);
    const box = new THREE.Box3().setFromObject(object);
    expect(box.max.y - box.min.y).toBeCloseTo(1.0, 5);
    expect(box.min.y).toBeCloseTo(0, 5);
    expect((box.max.x + box.min.x) / 2).toBeCloseTo(0, 5);
    expect((box.max.z + box.min.z) / 2).toBeCloseTo(0, 5);
  });

  it("clamps the footprint to maxFootprint by shrinking further", () => {
    const { object } = normalizeObjectModel(boxModel(), 1.0, 0.3);
    const box = new THREE.Box3().setFromObject(object);
    const footprint = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
    expect(footprint).toBeLessThanOrEqual(0.3 + 1e-6);
  });

  it("clamps envMapIntensity, disables shadows and counts triangles", () => {
    const { object, triangles } = normalizeObjectModel(boxModel(), 1.0, 10);
    let checked = 0;
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        expect(child.castShadow).toBe(false);
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          expect((m as THREE.MeshStandardMaterial).envMapIntensity).toBeLessThanOrEqual(1.5);
        }
        checked++;
      }
    });
    expect(checked).toBe(1);
    expect(triangles).toBe(12); // a box is 12 triangles
  });

  it("does not mutate the source scene", () => {
    const source = boxModel();
    normalizeObjectModel(source, 1.0, 10);
    const mesh = source.children[0] as THREE.Mesh;
    expect(mesh.scale.x).toBe(1);
    expect(mesh.position.x).toBe(5);
  });
});
