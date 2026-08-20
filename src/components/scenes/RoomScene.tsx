import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "../effects/Particles";
import { Burst } from "../effects/Glow";
import { gameConfig } from "../../config/gameConfig";
import { AudioManager } from "../audio/AudioManager";
import DialogueBox from "../ui/DialogueBox";
import VoiceControl from "../ui/VoiceControl";
import InteractiveButton from "../ui/InteractiveButton";

import type { ReactElement } from "react";

const SHAPES: Record<string, ReactElement> = {
  shoes: (
    <mesh>
      <boxGeometry args={[0.4, 0.16, 0.22]} />
      <meshStandardMaterial color="#8a5a3c" roughness={0.7} />
    </mesh>
  ),
  phone: (
    <mesh>
      <boxGeometry args={[0.14, 0.28, 0.02]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.4} />
    </mesh>
  ),
  bag: (
    <mesh>
      <cylinderGeometry args={[0.16, 0.2, 0.32, 16]} />
      <meshStandardMaterial color="#5a3a2a" roughness={0.8} />
    </mesh>
  ),
  umbrella: (
    <mesh>
      <coneGeometry args={[0.22, 0.18, 12]} />
      <meshStandardMaterial color="#2a4a6a" roughness={0.6} />
    </mesh>
  ),
  heart: (
    <mesh rotation={[0, 0, Math.PI]}>
      <torusKnotGeometry args={[0.1, 0.045, 64, 8, 2, 3]} />
      <meshStandardMaterial color="#ff6fae" emissive="#ff2f7e" emissiveIntensity={0.5} />
    </mesh>
  ),
};

interface ObjectItemProps {
  id: string;
  label: string;
  correct: boolean;
  position: [number, number, number];
  disabled: boolean;
  onChoose: (id: string, correct: boolean, pos: [number, number, number]) => void;
}

function ObjectItem({ id, correct, position, disabled, onChoose }: ObjectItemProps) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    const targetY = position[1] + (hovered ? 0.12 : 0) + Math.sin(t * 1.2 + position[0]) * 0.02;
    group.current.position.y += (targetY - group.current.position.y) * 0.15;
    group.current.rotation.y += 0.01;
    const targetScale = hovered ? 1.25 : 1;
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
  });

  return (
    <group
      ref={group}
      position={position}
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
        onChoose(id, correct, position);
      }}
    >
      {SHAPES[id]}
      <pointLight color={hovered ? "#ffd98a" : "#000000"} intensity={hovered ? 1.2 : 0} distance={1.5} />
      <sprite position={[0, -0.28, 0]} scale={[0.6, 0.16, 1]}>
        <spriteMaterial color="#f5e6c8" transparent opacity={hovered ? 0.95 : 0.4} />
      </sprite>
    </group>
  );
}

function CandleLight() {
  const light = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!light.current) return;
    light.current.intensity = 2.2 + Math.sin(state.clock.getElapsedTime() * 6) * 0.3 + Math.random() * 0.1;
  });
  return <pointLight ref={light} position={[0, 1.2, 0.5]} color="#ffb347" intensity={2.2} distance={6} />;
}

interface RoomSceneProps {
  onSolved: () => void;
}

const objPositions: [number, number, number][] = [
  [-1.4, 0, 0.4],
  [-0.6, 0, 0.6],
  [0.2, 0, 0.3],
  [1.0, 0, 0.55],
  [1.7, 0.1, 0.2],
];

export default function RoomScene({ onSolved }: RoomSceneProps) {
  const [dialogue, setDialogue] = useState<string | null>(
    "You're going to need a few things. But there's one thing you absolutely cannot forget."
  );
  const [burst, setBurst] = useState<{ pos: [number, number, number] } | null>(null);
  const [heartFound, setHeartFound] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [voiceDone, setVoiceDone] = useState(false);
  const [easterEgg, setEasterEgg] = useState<string | null>(null);
  const [hiddenClicked, setHiddenClicked] = useState(false);

  const clickHidden = () => {
    AudioManager.playTone("hover");
    setEasterEgg(
      hiddenClicked ? gameConfig.easterEggs.hiddenReveal : gameConfig.easterEggs.hiddenFound
    );
    setHiddenClicked(true);
    setTimeout(() => setEasterEgg(null), 2200);
  };

  const handleChoose = (_id: string, correct: boolean, pos: [number, number, number]) => {
    if (correct) {
      setHeartFound(true);
      AudioManager.playTone("chime");
      setBurst({ pos });
      setDialogue("Correct. Although technically... I was hoping you'd bring that smile yourself.");
      setTimeout(() => setShowVoice(true), 2600);
    } else {
      AudioManager.playTone("click");
      setDialogue("Not quite. Keep looking.");
    }
  };

  return (
    <div className="scene room-scene">
      <Canvas camera={{ position: [0, 0.6, 3.4], fov: 45 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#0a0705"]} />
        <fog attach="fog" args={["#0a0705", 4, 11]} />
        <ambientLight intensity={0.15} />
        <CandleLight />
        <Suspense fallback={null}>
          <Particles count={150} radius={5} color="#ffcf8f" size={0.02} speed={0.01} />
          {/* Table */}
          <mesh position={[0, -0.35, 0]} receiveShadow>
            <boxGeometry args={[4.2, 0.15, 1.6]} />
            <meshStandardMaterial color="#3a2415" roughness={0.85} />
          </mesh>
          {gameConfig.tableObjects.map((obj, i) => (
            <ObjectItem
              key={obj.id}
              id={obj.id}
              label={obj.label}
              correct={obj.correct}
              position={objPositions[i]}
              disabled={heartFound}
              onChoose={handleChoose}
            />
          ))}
          {burst && (
            <Burst position={burst.pos} color="#ff6fae" active={true} count={70} onDone={() => setBurst(null)} />
          )}
          {/* Hidden character easter egg — tucked in a dark corner */}
          <mesh
            position={[-1.9, -0.15, -0.9]}
            scale={0.12}
            onClick={(e) => {
              e.stopPropagation();
              clickHidden();
            }}
            onPointerOver={() => (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "auto")}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#1a1410" emissive="#2a2015" emissiveIntensity={0.3} />
          </mesh>
        </Suspense>
      </Canvas>

      <DialogueBox text={dialogue} position="bottom" />

      <AnimatePresence>
        {easterEgg && (
          <motion.div
            className="easter-egg-toast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {easterEgg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVoice && !voiceDone && (
          <motion.div
            className="voice-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VoiceControl
              question={gameConfig.voicePuzzle.question}
              acceptedAnswers={gameConfig.voicePuzzle.acceptedAnswers}
              onResult={(correct) => {
                if (correct) {
                  setTimeout(() => setVoiceDone(true), 900);
                }
              }}
            />
            <button className="voice-skip" onClick={() => setVoiceDone(true)}>
              Skip this part →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voiceDone && (
          <motion.div
            className="continue-cta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <InteractiveButton onClick={onSolved}>CONTINUE</InteractiveButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
