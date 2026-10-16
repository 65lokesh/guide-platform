"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";

// Put your .glb file at /public/models/robot.glb
// Works whether the file has a baked animation clip or is a static mesh —
// if there's no baked clip, a gentle procedural float/sway is applied instead,
// so you don't need SEELE/Tripo's paid "Bind skeleton" or "Animation" features.
const MODEL_PATH = "/models/robot.glb";

// Tracks the cursor position normalized to the FULL window, not just the
// canvas element. (0,0) = window center = robot looks straight ahead.
// -1 = far left/top edge of the window, 1 = far right/bottom edge.
function useWindowPointer() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return pointer;
}

function RobotModel({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions, names } = useAnimations(animations, group);
  const hasBakedAnimation = names.length > 0;

  useEffect(() => {
    if (!hasBakedAnimation) return;
    const action = actions[names[0]];
    action?.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    return () => {
      action?.stop();
    };
  }, [actions, names, hasBakedAnimation]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    // pointer.x/y: 0 at window center -> robot faces straight ahead.
    const targetY = pointer.current.x * 0.5; // left/right turn
    const targetX = -pointer.current.y * 0.3; // up/down tilt

    // Smoothly ease toward the target instead of snapping
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.36);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.36);

    // Keep a subtle idle bob only when there's no baked animation clip
    if (!hasBakedAnimation) {
      group.current.position.y = Math.sin(t * 1.2) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={1.4} position={[0, -1.2, 0]} />
    </group>
  );
}

export default function RobotPanel() {
  const pointer = useWindowPointer();

  return (
    <Canvas camera={{ position: [0, 0.4, 3.2], fov: 35 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 4, 3]} intensity={1.2} />
      <pointLight position={[-3, -1, -2]} intensity={0.4} color="#7a8cff" />

      <Suspense fallback={null}>
        <RobotModel pointer={pointer} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

// Preloads the model as soon as this module is imported
useGLTF.preload(MODEL_PATH);