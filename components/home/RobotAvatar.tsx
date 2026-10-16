"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import CanvasErrorBoundary from "./CanvasErrorBoundary";
import RobotFallback from "./RobotFallback";
import { heroTheme } from "./heroTheme";

/* ---------- TUNING KNOBS ---------- */
const MODEL_URL = "/models/robot.glb";
const TARGET_HEIGHT = 3.1;   // model height in scene units (bigger = bigger robot)
const BOTTOM_Y = -2.1;       // where the model's bottom sits (lower = more cropped)
const NECK_RATIO = 0.31;     // neck line as a fraction of model height, measured from the bottom
const NECK_BLEND = 0.06;     // softness of the bend around the neck line
const MAX_YAW = 0.65;        // max left/right turn (radians)
const MAX_PITCH = 0.35;      // max up/down tilt (radians)
const FOLLOW_SPEED = 7;      // higher = snappier tracking
const HEAD_SCREEN_Y = 0.38;  // where the face sits vertically inside the canvas (0 = top, 1 = bottom)
const YAW_DIRECTION = 1;     // set to -1 if the head turns away from the cursor
const PITCH_DIRECTION = 1;   // set to -1 if the head looks opposite vertically
const DEBUG_NECK = false;    // true = tints the part of the model that moves red
/* ---------------------------------- */

type HeadUniforms = {
  uYaw: { value: number };
  uPitch: { value: number };
  uPivot: { value: THREE.Vector3 };
  uNeckY: { value: number };
  uBlend: { value: number };
  uDebug: { value: number };
};

function patchMaterial(material: THREE.Material, u: HeadUniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uYaw = u.uYaw;
    shader.uniforms.uPitch = u.uPitch;
    shader.uniforms.uPivot = u.uPivot;
    shader.uniforms.uNeckY = u.uNeckY;
    shader.uniforms.uBlend = u.uBlend;
    shader.uniforms.uDebug = u.uDebug;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uYaw;
        uniform float uPitch;
        uniform vec3 uPivot;
        uniform float uNeckY;
        uniform float uBlend;
        varying float vHeadW;
        vec3 headRot(vec3 v, float yaw, float pitch) {
          float cy = cos(yaw); float sy = sin(yaw);
          v = vec3(cy * v.x + sy * v.z, v.y, -sy * v.x + cy * v.z);
          float cp = cos(pitch); float sp = sin(pitch);
          return vec3(v.x, cp * v.y - sp * v.z, sp * v.y + cp * v.z);
        }`
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        {
          float nw = smoothstep(uNeckY - uBlend, uNeckY + uBlend, position.y);
          objectNormal = headRot(objectNormal, uYaw * nw, uPitch * nw);
        }`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float headW = smoothstep(uNeckY - uBlend, uNeckY + uBlend, position.y);
        vHeadW = headW;
        transformed = headRot(transformed - uPivot, uYaw * headW, uPitch * headW) + uPivot;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uDebug;
        varying float vHeadW;`
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        if (uDebug > 0.5) gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.15, 0.15), vHeadW * 0.55);`
      );
  };
  material.customProgramCacheKey = () => "head-follow-v1";
  material.needsUpdate = true;
}

function GLBModel() {
  const { scene } = useGLTF(MODEL_URL);
  const { gl } = useThree();
  const gaze = useRef({ x: 0, y: 0 });

  const uniforms = useMemo<HeadUniforms>(
    () => ({
      uYaw: { value: 0 },
      uPitch: { value: 0 },
      uPivot: { value: new THREE.Vector3() },
      uNeckY: { value: 0 },
      uBlend: { value: 0.1 },
      uDebug: { value: DEBUG_NECK ? 1 : 0 },
    }),
    []
  );

  const prepared = useMemo(() => {
    const group = new THREE.Group();
    const box = new THREE.Box3();
    scene.updateMatrixWorld(true);

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      geometry.computeBoundingBox();
      if (geometry.boundingBox) box.union(geometry.boundingBox);

      const original = mesh.material;
      const cloneAndPatch = (m: THREE.Material) => {
        const c = m.clone();
        patchMaterial(c, uniforms);
        return c;
      };
      const material = Array.isArray(original) ? original.map(cloneAndPatch) : cloneAndPatch(original);

      const copy = new THREE.Mesh(geometry, material);
      copy.frustumCulled = false;
      group.add(copy);
    });

    const height = box.max.y - box.min.y || 1;
    const center = new THREE.Vector3();
    box.getCenter(center);
    const neckY = box.min.y + height * NECK_RATIO;

    uniforms.uNeckY.value = neckY;
    uniforms.uBlend.value = height * NECK_BLEND;
    uniforms.uPivot.value.set(center.x, neckY, center.z);

    const s = TARGET_HEIGHT / height;
    const offset = new THREE.Vector3(-s * center.x, BOTTOM_Y - s * box.min.y, -s * center.z);

    return { group, s, offset };
  }, [scene, uniforms]);

  useEffect(() => {
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * HEAD_SCREEN_Y;
      gaze.current.x = clamp((e.clientX - cx) / (window.innerWidth * 0.5));
      gaze.current.y = clamp((e.clientY - cy) / (window.innerHeight * 0.5));
    };
    const onLeave = () => {
      gaze.current.x = 0;
      gaze.current.y = 0;
    };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const targetYaw = gaze.current.x * MAX_YAW * YAW_DIRECTION;
    const targetPitch = gaze.current.y * MAX_PITCH * PITCH_DIRECTION;
    uniforms.uYaw.value = THREE.MathUtils.damp(uniforms.uYaw.value, targetYaw, FOLLOW_SPEED, delta);
    uniforms.uPitch.value = THREE.MathUtils.damp(uniforms.uPitch.value, targetPitch, FOLLOW_SPEED, delta);
  });

  return (
    <group position={prepared.offset} scale={prepared.s}>
      <primitive object={prepared.group} />
    </group>
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <span style={{ color: heroTheme.textMuted, fontSize: 12, fontFamily: "monospace" }}>
        loading guide... {Math.round(progress)}%
      </span>
    </Html>
  );
}

export default function RobotAvatar() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 30 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 3, 5]} intensity={2} color={heroTheme.keyLight} />
        <directionalLight position={[-4, 1, 3]} intensity={1.2} color={heroTheme.rimLight} />
        <CanvasErrorBoundary fallback={<RobotFallback />}>
          <Suspense fallback={<Loader />}>
            <Environment resolution={256}>
              <Lightformer form="rect" intensity={2.5} position={[3, 2, 4]} scale={[6, 4, 1]} color={heroTheme.keyLight} />
              <Lightformer form="rect" intensity={1.5} position={[-4, 1, 2]} scale={[4, 4, 1]} color={heroTheme.rimLight} />
              <Lightformer form="rect" intensity={1} position={[0, -3, 3]} scale={[8, 2, 1]} color="#ffffff" />
            </Environment>
            <GLBModel />
          </Suspense>
        </CanvasErrorBoundary>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
