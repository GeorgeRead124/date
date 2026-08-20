import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FirefliesProps {
  count?: number;
  area?: [number, number, number];
  color?: string;
}

/** Small warm glowing points that drift and bob like fireflies at night */
export default function Fireflies({
  count = 60,
  area = [20, 4, 20],
  color = "#ffd98a",
}: FirefliesProps) {
  const points = useRef<THREE.Points>(null);

  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area[0];
      pos[i * 3 + 1] = Math.random() * area[1];
      pos[i * 3 + 2] = (Math.random() - 0.5) * area[2];
      ph[i] = Math.random() * Math.PI * 2;
    }
    return [pos, ph];
  }, [count, area]);

  useFrame((state) => {
    if (!points.current) return;
    const t = state.clock.getElapsedTime();
    const arr = points.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += Math.sin(t * 0.6 + phases[i]) * 0.003;
      arr[i * 3 + 1] += Math.cos(t * 0.8 + phases[i]) * 0.002;
      arr[i * 3 + 2] += Math.sin(t * 0.4 + phases[i] * 2) * 0.003;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    const mat = points.current.material as THREE.PointsMaterial;
    mat.opacity = 0.5 + Math.sin(t * 2) * 0.3;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
