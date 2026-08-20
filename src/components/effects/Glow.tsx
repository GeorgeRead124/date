import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BurstProps {
  position?: [number, number, number];
  color?: string;
  active: boolean;
  onDone?: () => void;
  count?: number;
}

/** A one-shot particle burst, triggered by `active` going true */
export function Burst({ position = [0, 0, 0], color = "#ffd98a", active, onDone, count = 60 }: BurstProps) {
  const points = useRef<THREE.Points>(null);
  const velocities = useRef<Float32Array | undefined>(undefined);
  const life = useRef(0);
  const started = useRef(false);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useEffect(() => {
    if (active && !started.current) {
      started.current = true;
      life.current = 0;
      const vel = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.5 + Math.random() * 1.5;
        vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        vel[i * 3 + 2] = Math.cos(phi) * speed;
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
      }
      velocities.current = vel;
    }
    if (!active) started.current = false;
  }, [active, count, positions]);

  useFrame((_, delta) => {
    if (!started.current || !points.current || !velocities.current) return;
    life.current += delta;
    const arr = points.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities.current[i * 3] * delta;
      arr[i * 3 + 1] += velocities.current[i * 3 + 1] * delta - delta * 0.3;
      arr[i * 3 + 2] += velocities.current[i * 3 + 2] * delta;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    const mat = points.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - life.current / 1.4);
    if (life.current > 1.4) {
      started.current = false;
      onDone?.();
    }
  });

  return (
    <points ref={points} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
