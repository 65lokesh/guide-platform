"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMouseTracker } from "./useMouseTracker";

export default function RobotFallback() {
  const body = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const mouse = useMouseTracker();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (body.current) {
      body.current.position.y = Math.sin(t * 0.8) * 0.03;
    }

    if (neck.current) {
      const targetY = THREE.MathUtils.clamp(mouse.current.x * 0.5, -0.5, 0.5);
      const targetX = THREE.MathUtils.clamp(mouse.current.y * 0.28, -0.28, 0.28);
      neck.current.rotation.y = THREE.MathUtils.lerp(neck.current.rotation.y, targetY, 0.12);
      neck.current.rotation.x = THREE.MathUtils.lerp(neck.current.rotation.x, targetX, 0.12);
    }

    const pulse = 1.2 + Math.sin(t * 2) * 0.3;
    if (leftEye.current) (leftEye.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    if (rightEye.current) (rightEye.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
  });

  return (
    <group ref={body} scale={2.6}>
      {/* neck pivot sits below the head; head is offset back up inside it */}
      <group ref={neck} position={[0, -0.6, 0]}>
        <group position={[0, 0.6, 0]}>
          <mesh>
            <boxGeometry args={[1.3, 1.2, 1]} />
            <meshStandardMaterial color="#c9cdd4" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.52]}>
            <boxGeometry args={[1.05, 0.8, 0.06]} />
            <meshStandardMaterial color="#0a0a0d" roughness={0.4} />
          </mesh>
          <mesh ref={leftEye} position={[-0.25, 0, 0.56]}>
            <sphereGeometry args={[0.14, 24, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffb37a" emissiveIntensity={1.2} />
          </mesh>
          <mesh ref={rightEye} position={[0.25, 0, 0.56]}>
            <sphereGeometry args={[0.14, 24, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffb37a" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[-0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
            <meshStandardMaterial color="#3a3d45" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
            <meshStandardMaterial color="#3a3d45" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
