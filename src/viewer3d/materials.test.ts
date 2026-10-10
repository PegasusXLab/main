import { describe, expect, it } from "vitest";
import { isSoftwareGL } from "./materials";

function fakeGL(renderer: unknown) {
  return {
    getContext: () => ({
      getExtension: (name: string) =>
        name === "WEBGL_debug_renderer_info"
          ? { UNMASKED_RENDERER_WEBGL: 37446 }
          : null,
      getParameter: (p: number) => (p === 37446 ? renderer : null),
    }),
  };
}

describe("isSoftwareGL (post chain gate)", () => {
  it("detects SwiftShader, llvmpipe and generic software rasterizers", () => {
    expect(isSoftwareGL(fakeGL("WebKit WebGL2 - SwiftShader"))).toBe(true);
    expect(isSoftwareGL(fakeGL("llvmpipe (LLVM 15)"))).toBe(true);
    expect(isSoftwareGL(fakeGL("Software WebGL"))).toBe(true);
  });

  it("keeps real GPUs (desktop, ANGLE metal/D3D, phones) on the post chain", () => {
    expect(isSoftwareGL(fakeGL("ANGLE (Apple, ANGLE Metal)"))).toBe(false);
    expect(isSoftwareGL(fakeGL("ANGLE (Google, Vulkan 1.3, D3D11)"))).toBe(false);
    expect(isSoftwareGL(fakeGL("Apple M1"))).toBe(false);
  });

  it("defaults to hardware when the string is missing or throws", () => {
    expect(
      isSoftwareGL({
        getContext: () => ({
          getExtension: () => null,
          getParameter: () => null,
        }),
      }),
    ).toBe(false);
    expect(
      isSoftwareGL({
        getContext: () => {
          throw new Error("no context");
        },
      }),
    ).toBe(false);
  });
});
