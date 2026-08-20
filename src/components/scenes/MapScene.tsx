import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "../effects/Particles";
import { Burst } from "../effects/Glow";
import { gameConfig } from "../../config/gameConfig";
import { AudioManager } from "../audio/AudioManager";
import DialogueBox from "../ui/DialogueBox";

interface MarkerProps {
  position: [number, number, number];
  label: string;
  correct: boolean;
  onChoose: (correct: boolean, pos: [number, number, number]) => void;
  disabled: boolean;
}

function Marker({ position, correct, onChoose, disabled }: MarkerProps) {
  const [hovered, setHovered] = useState(false);
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const target = hovered ? 1.35 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
    mesh.current.position.z = position[2] + (hovered ? 0.15 : 0) + Math.sin(state.clock.getElapsedTime() * 2) * 0.02;
  });

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
          AudioManager.playTone("hover");
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (disabled) return;
          onChoose(correct, position);
        }}
      >
        <circleGeometry args={[0.18, 32]} />
        <meshStandardMaterial
          color={hovered ? "#ffd98a" : "#c9a24d"}
          emissive={hovered ? "#ffb347" : "#7a5a20"}
          emissiveIntensity={hovered ? 1.4 : 0.5}
        />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[0.2, 0.24, 32]} />
        <meshBasicMaterial color="#ffd98a" transparent opacity={hovered ? 0.9 : 0.35} />
      </mesh>
      <sprite position={[0, 0.32, 0]} scale={[0.9, 0.24, 1]}>
        <spriteMaterial color="#f5e6c8" transparent opacity={hovered ? 1 : 0.75} />
      </sprite>
    </group>
  );
}

function Parchment({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.15) * 0.08;
    group.current.rotation.x = -0.15 + Math.sin(t * 0.2) * 0.02;
    group.current.position.y = Math.sin(t * 0.4) * 0.05;
  });
  return (
    <group ref={group} rotation={[-0.15, 0, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[4.4, 3, 32, 32]} />
        <meshStandardMaterial color="#d8c093" roughness={0.9} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[4.6, 3.2]} />
        <meshStandardMaterial color="#7a5a20" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {children}
    </group>
  );
}

interface MapSceneProps {
  onSolved: () => void;
}

const positions: [number, number, number][] = [
  [-1.3, 0.7, 0.02],
  [1.2, 0.75, 0.02],
  [0.1, -0.15, 0.02],
  [-0.9, -0.85, 0.02],
];

export default function MapScene({ onSolved }: MapSceneProps) {
  const [dialogue, setDialogue] = useState<string | null>(
    "Every adventure has to begin somewhere. Where do you think ours begins?"
  );
  const [burst, setBurst] = useState<{ pos: [number, number, number] } | null>(null);
  const [solved, setSolved] = useState(false);
  const [wrongIndex, setWrongIndex] = useState(0);

  const wrongLines = gameConfig.narration.level1Wrong;

  const handleChoose = (correct: boolean, pos: [number, number, number]) => {
    if (correct) {
      setSolved(true);
      AudioManager.playTone("chime");
      setBurst({ pos });
      setDialogue("Yes. Exactly there.");
      setTimeout(() => onSolved(), 2200);
    } else {
      AudioManager.playTone("click");
      setDialogue(wrongLines[wrongIndex % wrongLines.length]);
      setWrongIndex((i) => i + 1);
    }
  };

  return (
    <div className="scene map-scene">
      <Canvas camera={{ position: [0, 0, 5.2], fov: 42 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#050810"]} />
        <fog attach="fog" args={["#050810", 5, 12]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={0.8} color="#fff2d0" />
        <pointLight position={[-3, -2, 2]} color="#4d7fff" intensity={0.6} />
        <Suspense fallback={null}>
          <Particles count={200} radius={7} color="#8fb3ff" size={0.03} />
          <Parchment>
            {gameConfig.mapLocations.map((loc, i) => (
              <Marker
                key={loc.id}
                position={positions[i]}
                label={loc.label}
                correct={loc.correct}
                disabled={solved}
                onChoose={handleChoose}
              />
            ))}
          </Parchment>
          {burst && (
            <Burst position={burst.pos} color="#ffd98a" active={true} count={80} onDone={() => setBurst(null)} />
          )}
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3.5}
          maxDistance={7}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 3}
          autoRotate={false}
        />
      </Canvas>

      <div className="map-labels">
        {gameConfig.mapLocations.map((loc) => (
          <span key={loc.id} className="map-label-chip">
            {loc.label}
          </span>
        ))}
      </div>

      <DialogueBox text={dialogue} position="bottom" />

      <AnimatePresence>
        {!solved && (
          <motion.p
            className="map-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
          >
            Drag to rotate • Scroll to zoom • Click a marker
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
