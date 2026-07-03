import * as THREE from 'three';

import type { RenderFrame } from '../RenderFrame';
import type { Resolution } from '../Resolution';
import type { BlackHole } from '../BlackHole';

import fullscreenVert from './shaders/fullscreen.vert.glsl?raw';
import blackholeFrag from './shaders/blackhole.frag.glsl?raw';
import brightFrag from './shaders/bright.frag.glsl?raw';
import blurFrag from './shaders/blur.frag.glsl?raw';
import compositeFrag from './shaders/composite.frag.glsl?raw';

const FOV_DEGREES = 60;

/** Format a number as a GLSL float literal (always with a decimal point). */
function glslFloat(n: number): string {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

/**
 * GPU adapter: the only place that imports three.js. Owns the WebGL2 renderer,
 * the HDR scene pass (Schwarzschild raymarching) and the multi-pass bloom /
 * tone-mapping pipeline. Physics constants arrive from the BlackHole entity and
 * are baked into the shader as `#define`s.
 */
export class ThreeRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh;

  private readonly bhMat: THREE.ShaderMaterial;
  private readonly brightMat: THREE.ShaderMaterial;
  private readonly blurMat: THREE.ShaderMaterial;
  private readonly compMat: THREE.ShaderMaterial;

  private readonly rtType: THREE.TextureDataType;
  private rtScene!: THREE.WebGLRenderTarget;
  private rtHalfA!: THREE.WebGLRenderTarget;
  private rtHalfB!: THREE.WebGLRenderTarget;
  private rtQuartA!: THREE.WebGLRenderTarget;
  private rtQuartB!: THREE.WebGLRenderTarget;
  private width = 2;
  private height = 2;

  private readonly camBasis = new THREE.Matrix3();

  constructor(canvas: HTMLCanvasElement, blackHole: BlackHole) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    if (!this.renderer.capabilities.isWebGL2) {
      throw new Error('WebGL2 is not available');
    }
    this.renderer.setPixelRatio(1);
    this.renderer.autoClear = false;
    // The composite shader applies its own gamma; skip the renderer's sRGB pass.
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const floatOK = !!this.renderer.getContext().getExtension('EXT_color_buffer_float');
    this.rtType = floatOK ? THREE.HalfFloatType : THREE.UnsignedByteType;

    // Full-screen triangle covering the viewport.
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    this.quad = new THREE.Mesh(geo, undefined);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    const physicsDefines: Record<string, string> = {
      R_S: glslFloat(blackHole.schwarzschildRadius),
      DISK_IN: glslFloat(blackHole.diskInner),
      DISK_OUT: glslFloat(blackHole.diskOuter),
      ESC_R: glslFloat(blackHole.escapeRadius),
    };

    this.bhMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: fullscreenVert,
      fragmentShader: blackholeFrag,
      defines: physicsDefines,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uCamPos: { value: new THREE.Vector3() },
        uCamBasis: { value: this.camBasis },
        uFovTan: { value: Math.tan(THREE.MathUtils.degToRad(FOV_DEGREES) / 2) },
        uSteps: { value: 120 },
        uDiskGain: { value: 1.0 },
        uDoppler: { value: 0.55 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.brightMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: fullscreenVert,
      fragmentShader: brightFrag,
      uniforms: { tex: { value: null }, uThresh: { value: 1.0 }, uKnee: { value: 0.6 } },
      depthTest: false,
      depthWrite: false,
    });

    this.blurMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: fullscreenVert,
      fragmentShader: blurFrag,
      uniforms: { tex: { value: null }, uDir: { value: new THREE.Vector2() } },
      depthTest: false,
      depthWrite: false,
    });

    this.compMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: fullscreenVert,
      fragmentShader: compositeFrag,
      uniforms: {
        tScene: { value: null },
        tBloomA: { value: null },
        tBloomB: { value: null },
        uBloom: { value: 1.15 },
        uExpo: { value: 1.0 },
        uRTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
  }

  resize(width: number, height: number): void {
    this.width = Math.max(2, width);
    this.height = Math.max(2, height);
    this.renderer.setSize(this.width, this.height, false);

    this.disposeTargets();
    this.rtScene = this.makeTarget(this.width, this.height);
    this.rtHalfA = this.makeTarget(this.width >> 1, this.height >> 1);
    this.rtHalfB = this.makeTarget(this.width >> 1, this.height >> 1);
    this.rtQuartA = this.makeTarget(this.width >> 2, this.height >> 2);
    this.rtQuartB = this.makeTarget(this.width >> 2, this.height >> 2);

    (this.bhMat.uniforms.uRes.value as THREE.Vector2).set(this.width, this.height);
  }

  render(frame: RenderFrame): void {
    const p = frame.cameraPosition;
    const b = frame.cameraBasis;
    this.camBasis.set(
      b.right.x,
      b.up.x,
      b.forward.x,
      b.right.y,
      b.up.y,
      b.forward.y,
      b.right.z,
      b.up.z,
      b.forward.z,
    );

    const u = this.bhMat.uniforms;
    u.uTime.value = frame.diskTime;
    (u.uCamPos.value as THREE.Vector3).set(p.x, p.y, p.z);
    u.uSteps.value = frame.steps;
    u.uDiskGain.value = frame.diskGain;
    u.uDoppler.value = frame.doppler;

    // 1) HDR scene
    this.pass(this.bhMat, this.rtScene);

    // 2) brightness threshold at half resolution
    this.brightMat.uniforms.tex.value = this.rtScene.texture;
    this.pass(this.brightMat, this.rtHalfA);

    // 3) separable Gaussian blur H/V (half resolution)
    const hw = this.rtHalfA.width;
    const hh = this.rtHalfA.height;
    this.blurMat.uniforms.tex.value = this.rtHalfA.texture;
    (this.blurMat.uniforms.uDir.value as THREE.Vector2).set(1.4 / hw, 0);
    this.pass(this.blurMat, this.rtHalfB);
    this.blurMat.uniforms.tex.value = this.rtHalfB.texture;
    (this.blurMat.uniforms.uDir.value as THREE.Vector2).set(0, 1.4 / hh);
    this.pass(this.blurMat, this.rtHalfA);

    // 4) wider second level (quarter resolution)
    const qw = this.rtQuartA.width;
    const qh = this.rtQuartA.height;
    this.blurMat.uniforms.tex.value = this.rtHalfA.texture;
    (this.blurMat.uniforms.uDir.value as THREE.Vector2).set(1.4 / qw, 0);
    this.pass(this.blurMat, this.rtQuartA);
    this.blurMat.uniforms.tex.value = this.rtQuartA.texture;
    (this.blurMat.uniforms.uDir.value as THREE.Vector2).set(0, 1.4 / qh);
    this.pass(this.blurMat, this.rtQuartB);

    // 5) final composite
    this.compMat.uniforms.tScene.value = this.rtScene.texture;
    this.compMat.uniforms.tBloomA.value = this.rtHalfA.texture;
    this.compMat.uniforms.tBloomB.value = this.rtQuartB.texture;
    this.compMat.uniforms.uBloom.value = frame.bloom;
    this.compMat.uniforms.uExpo.value = frame.exposure;
    this.compMat.uniforms.uRTime.value = frame.realTime;
    this.pass(this.compMat, null);
  }

  getResolution(): Resolution {
    return { width: this.width, height: this.height };
  }

  private pass(material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null): void {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  private makeTarget(w: number, h: number): THREE.WebGLRenderTarget {
    return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: this.rtType,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  private disposeTargets(): void {
    for (const rt of [this.rtScene, this.rtHalfA, this.rtHalfB, this.rtQuartA, this.rtQuartB]) {
      rt?.dispose();
    }
  }
}
