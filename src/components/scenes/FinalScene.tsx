import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "../effects/Particles";
import Fireflies from "../effects/Fireflies";
import { Burst } from "../effects/Glow";
import { gameConfig } from "../../config/gameConfig";
import { AudioManager } from "../audio/AudioManager";
import DialogueBox from "../ui/DialogueBox";
import InteractiveButton from "../ui/InteractiveButton";
import { useGame } from "../game/GameState";

type Step = "chestEmpty" | "portal" | "path" | "finalChest" | "opening" | "reveal";

/* ---------- Empty chest (reuse simple chest geometry) ---------- */
function SimpleChest({ open }: { open: boolean }) {
  const lid = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!lid.current) return;
    const target = open ? -1.9 : -0.3;
    lid.current.rotation.x += (target - lid.current.rotation.x) * 0.06;
  });
  return (
    <group position={[0, -0.9, 0]}>
      <mesh>
        <boxGeometry args={[1.3, 0.7, 0.9]} />
        <meshStandardMaterial color="#4a2f18" roughness={0.7} />
      </mesh>
      <group position={[0, 0.35, -0.45]}>
        <mesh ref={lid} position={[0, 0, 0.45]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[1.32, 0.4, 0.9]} />
          <meshStandardMaterial color="#6a4a28" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function Portal({ scale }: { scale: number }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ring.current) return;
    ring.current.rotation.z += 0.01;
    const t = state.clock.getElapsedTime();
    const mat = ring.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.5 + Math.sin(t * 3) * 0.4;
  });
  return (
    <group scale={scale}>
      <mesh ref={ring}>
        <torusGeometry args={[1.1, 0.08, 24, 100]} />
        <meshStandardMaterial color="#4d7fff" emissive="#4d7fff" emissiveIntensity={1.5} />
      </mesh>
      <mesh>
        <circleGeometry args={[1.05, 64]} />
        <meshBasicMaterial color="#0a1030" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#4d7fff" intensity={4} distance={6} />
    </group>
  );
}

function Landscape({ onMoonClick }: { onMoonClick?: () => void }) {
  return (
    <>
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40, 1, 1]} />
        <meshStandardMaterial color="#0a0f1a" roughness={1} />
      </mesh>
      {[...Array(9)].map((_, i) => (
        <mesh
          key={i}
          position={[(Math.random() - 0.5) * 16, -0.9 + Math.random() * 0.3, -3 - Math.random() * 6]}
        >
          <coneGeometry args={[0.4 + Math.random() * 0.4, 1.4 + Math.random() * 1.2, 6]} />
          <meshStandardMaterial color="#0d1420" roughness={1} />
        </mesh>
      ))}
      <mesh
        position={[3, 4, -12]}
        onClick={(e) => {
          e.stopPropagation();
          onMoonClick?.();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshStandardMaterial color="#f5f0e0" emissive="#f5f0e0" emissiveIntensity={0.8} />
      </mesh>
    </>
  );
}

function GlowingPath({ progress }: { progress: number }) {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= 20; i++) {
    points.push([Math.sin(i * 0.3) * 1.5, -1.55, -i * 1.2]);
  }
  return (
    <>
      {points.map((p, i) => {
        const lit = i / points.length <= progress;
        return (
          <mesh key={i} position={p}>
            <circleGeometry args={[0.18, 16]} />
            <meshStandardMaterial
              color={lit ? "#ffd98a" : "#3a3a4a"}
              emissive={lit ? "#ffd98a" : "#000000"}
              emissiveIntensity={lit ? 1.2 : 0}
              rotation-x={-Math.PI / 2}
            />
          </mesh>
        );
      })}
    </>
  );
}

function CameraRig({ z }: { z: number }) {
  useFrame((state) => {
    state.camera.position.z += (z - state.camera.position.z) * 0.04;
    state.camera.lookAt(0, 0, z - 5);
  });
  return null;
}

interface FinalSceneProps {
  onGalleryReady: () => void;
}

export default function FinalScene({ onGalleryReady }: FinalSceneProps) {
  const { setPhase } = useGame();
  const [step, setStep] = useState<Step>("chestEmpty");
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [pathProgress, setPathProgress] = useState(0);
  const [wordIndex, setWordIndex] = useState(-1);
  const [heartBurst, setHeartBurst] = useState(false);
  const [dark, setDark] = useState(false);
  const [heartUp, setHeartUp] = useState(false);
  const [easterEgg, setEasterEgg] = useState<string | null>(null);

  const clickMoon = () => {
    setEasterEgg(gameConfig.easterEggs.moon);
    AudioManager.playTone("hover");
    setTimeout(() => setEasterEgg(null), 2200);
  };

  const words = gameConfig.narration.pathWords;

  // Chest empty sequence
  useEffect(() => {
    if (step !== "chestEmpty") return;
    setPhase("chestEmpty");
    const t1 = setTimeout(() => setDialogue(gameConfig.narration.chestEmpty1), 800);
    const t2 = setTimeout(() => setDialogue(gameConfig.narration.chestEmpty2), 2400);
    const t3 = setTimeout(() => {
      setDialogue(gameConfig.narration.chestEmpty3);
      setStep("portal");
    }, 4600);
    return () => [t1, t2, t3].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "portal") return;
    setPhase("portal");
  }, [step, setPhase]);

  useEffect(() => {
    if (step !== "path") return;
    setPhase("path");
    setDialogue(null);
    let i = 0;
    const interval = setInterval(() => {
      setPathProgress((p) => Math.min(1, p + 1 / words.length));
      setWordIndex(i);
      AudioManager.playTone("chime");
      i++;
      if (i >= words.length) {
        clearInterval(interval);
        setTimeout(() => setStep("finalChest"), 1800);
      }
    }, 1600);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "finalChest") return;
    setPhase("finalChest");
    const t1 = setTimeout(() => setDialogue(gameConfig.narration.finalIntro1), 800);
    const t2 = setTimeout(() => setDialogue(gameConfig.narration.finalIntro2), 2600);
    return () => [t1, t2].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const openFinalChest = () => {
    setStep("opening");
    setDark(true);
    AudioManager.setMuted(true);
    setTimeout(() => {
      AudioManager.setMuted(false);
      setDark(false);
      setHeartUp(true);
      setHeartBurst(true);
      AudioManager.playTone("burst");
      setPhase("reveal");
      setTimeout(() => setStep("reveal"), 1600);
    }, 1600);
  };

  return (
    <div className="scene final-scene">
      <Canvas camera={{ position: [0, 0.4, 5] }} dpr={[1, 1.5]}>
        <color attach="background" args={["#050810"]} />
        <fog attach="fog" args={["#050810", 6, 20]} />
        <ambientLight intensity={0.15} />

        <Suspense fallback={null}>
          {step === "chestEmpty" && (
            <>
              <Particles count={200} radius={6} color="#7fa8ff" size={0.03} />
              <SimpleChest open={true} />
            </>
          )}

          {step === "portal" && (
            <>
              <Particles count={200} radius={6} color="#7fa8ff" size={0.03} />
              <Portal scale={1} />
              <mesh position={[0, -1.6, -1]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#050810" />
              </mesh>
            </>
          )}

          {step === "path" && (
            <>
              <Landscape onMoonClick={clickMoon} />
              <Fireflies count={50} area={[14, 3, 20]} />
              <GlowingPath progress={pathProgress} />
              <CameraRig z={-pathProgress * 22} />
            </>
          )}

          {(step === "finalChest" || step === "opening" || step === "reveal") && (
            <>
              <Landscape onMoonClick={clickMoon} />
              <Fireflies count={40} area={[10, 3, 8]} />
              <Particles count={180} radius={6} color="#ffd98a" size={0.03} />
              <SimpleChest open={step !== "finalChest"} />
              {heartUp && (
                <mesh position={[0, 1.2, 0]}>
                  <torusKnotGeometry args={[0.28, 0.11, 100, 16, 2, 3]} />
                  <meshStandardMaterial color="#ff6fae" emissive="#ff2f7e" emissiveIntensity={1.6} />
                </mesh>
              )}
              {heartBurst && (
                <Burst position={[0, 0, 0]} color="#ff6fae" active count={120} onDone={() => setHeartBurst(false)} />
              )}
            </>
          )}
        </Suspense>
      </Canvas>

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

      {dark && (
        <motion.div
          className="hard-fade"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      )}

      {(step === "chestEmpty" || step === "portal" || step === "finalChest") && (
        <DialogueBox text={dialogue} position="top" />
      )}

      {step === "portal" && (
        <motion.div
          className="continue-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <InteractiveButton onClick={() => setStep("path")}>FOLLOW THE LIGHT</InteractiveButton>
        </motion.div>
      )}

      {step === "path" && (
        <div className="path-word-overlay">
          <AnimatePresence mode="wait">
            {wordIndex >= 0 && (
              <motion.h2
                key={wordIndex}
                initial={{ opacity: 0, scale: 0.8, letterSpacing: "0.4em" }}
                animate={{ opacity: 1, scale: 1, letterSpacing: "0.1em" }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.9 }}
              >
                {words[wordIndex]}
              </motion.h2>
            )}
          </AnimatePresence>
          <p className="path-hint">Tap anywhere to keep walking</p>
        </div>
      )}
      {step === "path" && (
        <div
          className="path-tap-zone"
          onClick={() => setPathProgress((p) => Math.min(1, p + 0.001))}
        />
      )}

      {step === "finalChest" && (
        <motion.div
          className="continue-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2 }}
        >
          <InteractiveButton onClick={openFinalChest}>OPEN THE TREASURE</InteractiveButton>
        </motion.div>
      )}

      {step === "reveal" && (
        <motion.div
          className="reveal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4 }}
        >
          <p className="reveal-kicker">TREASURE FOUND</p>
          <p className="reveal-sub">Your treasure is...</p>
          <h1 className="reveal-title">A DATE WITH {gameConfig.myName.toUpperCase()} ❤️</h1>
          <div className="reveal-details">
            <p>{gameConfig.date.date}</p>
            <p>{gameConfig.date.time}</p>
            <p>{gameConfig.date.location}</p>
          </div>
          <InteractiveButton onClick={onGalleryReady}>One more thing...</InteractiveButton>
        </motion.div>
      )}
    </div>
  );
}
