import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "../effects/Particles";
import { Burst } from "../effects/Glow";
import { gameConfig } from "../../config/gameConfig";
import { AudioManager } from "../audio/AudioManager";
import DialogueBox from "../ui/DialogueBox";
import InteractiveButton from "../ui/InteractiveButton";
import { useGame } from "../game/GameState";

function Crystal({ position, color, lit }: { position: [number, number, number]; color: string; lit: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += lit ? 0.015 : 0.004;
    const t = state.clock.getElapsedTime();
    mesh.current.position.y = position[1] + Math.sin(t + position[0]) * 0.05;
    const mat = mesh.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = lit ? 1.8 + Math.sin(t * 3) * 0.3 : 0.15;
  });
  return (
    <mesh ref={mesh} position={position}>
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.15}
        transparent
        opacity={0.9}
        roughness={0.1}
        metalness={0.2}
      />
      {lit && <pointLight color={color} intensity={2} distance={4} />}
    </mesh>
  );
}

function Chest({ glowing }: { glowing: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.position.y = -0.9 + (glowing ? Math.sin(t * 2) * 0.02 : 0);
  });
  return (
    <group ref={group} position={[0, -0.9, 0]}>
      <mesh>
        <boxGeometry args={[1.3, 0.7, 0.9]} />
        <meshStandardMaterial
          color="#4a2f18"
          roughness={0.7}
          emissive={glowing ? "#ffb347" : "#000000"}
          emissiveIntensity={glowing ? 0.6 : 0}
        />
      </mesh>
      <mesh position={[0, 0.5, -0.35]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.32, 0.4, 0.9]} />
        <meshStandardMaterial
          color="#6a4a28"
          roughness={0.7}
          emissive={glowing ? "#ffb347" : "#000000"}
          emissiveIntensity={glowing ? 0.6 : 0}
        />
      </mesh>
      <mesh position={[0, 0.05, 0.46]}>
        <boxGeometry args={[0.14, 0.14, 0.06]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
      </mesh>
      {glowing && <pointLight color="#ffb347" intensity={2.5} distance={5} />}
    </group>
  );
}

function CaveRocks({ onRockClick }: { onRockClick?: (clicks: number) => void }) {
  const rocks = [
    [-3, -1.2, -2, 1.4],
    [3.2, -1.1, -1.5, 1.7],
    [-2.5, -1.3, 1.5, 1.1],
    [2.6, -1.2, 1.8, 1.3],
  ] as [number, number, number, number][];
  const [clicks, setClicks] = useState(0);
  return (
    <>
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r[0], r[1], r[2]]}
          rotation={[Math.random(), Math.random(), Math.random()]}
          onClick={(e) => {
            e.stopPropagation();
            if (i !== 0) return;
            const next = clicks + 1;
            setClicks(next);
            onRockClick?.(next);
          }}
          onPointerOver={() => (document.body.style.cursor = i === 0 ? "pointer" : "auto")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <dodecahedronGeometry args={[r[3], 0]} />
          <meshStandardMaterial color="#2a2a30" roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

interface CaveSceneProps {
  onChestOpened: () => void;
}

export default function CaveScene({ onChestOpened }: CaveSceneProps) {
  const { crystalsLit, setCrystalLit } = useGame();
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [dialogue, setDialogue] = useState<string | null>(gameConfig.narration.level3Intro);
  const [burst, setBurst] = useState<{ pos: [number, number, number]; color: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [easterEgg, setEasterEgg] = useState<string | null>(null);

  const handleRockClick = (clicks: number) => {
    const msg = clicks === 1 ? gameConfig.easterEggs.rock1 : gameConfig.easterEggs.rock2;
    setEasterEgg(msg);
    AudioManager.playTone("hover");
    setTimeout(() => setEasterEgg(null), 2000);
  };

  const allLit = crystalsLit.every(Boolean);
  const positions: [number, number, number][] = [
    [-1.6, 0.6, 0],
    [0, 1.0, -0.3],
    [1.6, 0.6, 0],
  ];

  const submit = () => {
    if (activeQuestion >= gameConfig.questions.length) return;
    const q = gameConfig.questions[activeQuestion];
    const correct = q.acceptedAnswers.some((a) => answer.toLowerCase().includes(a.toLowerCase())) || answer.trim().length > 1;
    if (correct) {
      setCrystalLit(activeQuestion, true);
      AudioManager.playTone("chime");
      setBurst({ pos: positions[activeQuestion], color: q.crystalColor });
      setFeedback(null);
      setAnswer("");
      if (activeQuestion + 1 < gameConfig.questions.length) {
        setTimeout(() => setActiveQuestion((i) => i + 1), 900);
      } else {
        setTimeout(() => setDialogue(gameConfig.narration.level3Ready), 1200);
      }
    } else {
      setFeedback("Hmm, think again...");
    }
  };

  return (
    <div className="scene cave-scene">
      <Canvas camera={{ position: [0, 0.3, 5.5], fov: 45 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#050409"]} />
        <fog attach="fog" args={["#050409", 4, 13]} />
        <ambientLight intensity={0.12} />
        <directionalLight position={[0, 5, 3]} intensity={0.3} color="#8fb3ff" />
        <Suspense fallback={null}>
          <Particles count={220} radius={7} color="#7fa8ff" size={0.025} />
          <CaveRocks onRockClick={handleRockClick} />
          {gameConfig.questions.map((q, i) => (
            <Crystal key={i} position={positions[i]} color={q.crystalColor} lit={crystalsLit[i]} />
          ))}
          <Chest glowing={allLit} />
          {burst && (
            <Burst
              position={burst.pos}
              color={burst.color}
              active={true}
              count={70}
              onDone={() => setBurst(null)}
            />
          )}
        </Suspense>
      </Canvas>

      <DialogueBox text={dialogue} position="top" />

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

      {!allLit && activeQuestion < gameConfig.questions.length && (
        <motion.div
          className="question-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="question-count">
            Question {activeQuestion + 1} of {gameConfig.questions.length}
          </p>
          <p className="question-text">{gameConfig.questions[activeQuestion].prompt}</p>
          <div className="question-input-row">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Your answer..."
              autoFocus
            />
            <button onClick={submit}>✦</button>
          </div>
          {feedback && <p className="question-feedback">{feedback}</p>}
        </motion.div>
      )}

      <AnimatePresence>
        {allLit && (
          <motion.div
            className="continue-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <InteractiveButton onClick={onChestOpened}>OPEN THE CHEST</InteractiveButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
