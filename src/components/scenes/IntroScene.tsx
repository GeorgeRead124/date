import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "../effects/Particles";
import { gameConfig, fillTemplate } from "../../config/gameConfig";
import { AudioManager } from "../audio/AudioManager";
import InteractiveButton from "../ui/InteractiveButton";

function Lantern() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.position.y = -0.6 + Math.sin(t * 0.8) * 0.08;
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.03;
  });
  return (
    <group ref={ref} position={[0, -0.6, -1]}>
      <mesh>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color="#ffb347"
          emissive="#ffb347"
          emissiveIntensity={2.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight color="#ffb347" intensity={3.5} distance={6} decay={2} />
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.14, 12]} />
        <meshStandardMaterial color="#3a2a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.1, 0.05, 0.1, 12]} />
        <meshStandardMaterial color="#3a2a1a" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function CameraDrift({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    state.camera.position.x += (mouse.current.x * 0.4 - state.camera.position.x) * 0.02;
    state.camera.position.y += (-mouse.current.y * 0.25 - state.camera.position.y + 0.1) * 0.02;
    state.camera.lookAt(0, -0.4, -1);
  });
  return null;
}

interface IntroSceneProps {
  onBegin: () => void;
}

export default function IntroScene({ onBegin }: IntroSceneProps) {
  const mouse = useRef({ x: 0, y: 0 });
  const [textStep, setTextStep] = useState(-1);
  const [showButton, setShowButton] = useState(false);
  const [ambientStarted, setAmbientStarted] = useState(false);

  const lines = [
    fillTemplate(gameConfig.narration.intro1),
    gameConfig.narration.intro2,
    gameConfig.narration.intro3,
  ];

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const handleTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      mouse.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleTouch);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleTouch);
    };
  }, []);

  useEffect(() => {
    const t0 = setTimeout(() => setTextStep(0), 1200);
    const t1 = setTimeout(() => setTextStep(1), 4200);
    const t2 = setTimeout(() => setTextStep(2), 7200);
    const t3 = setTimeout(() => setShowButton(true), 10200);
    return () => [t0, t1, t2, t3].forEach(clearTimeout);
  }, []);

  const startAmbient = () => {
    if (ambientStarted) return;
    setAmbientStarted(true);
    AudioManager.unlock();
    AudioManager.startAmbient(gameConfig.audioFiles.ambient);
    AudioManager.speak(fillTemplate(gameConfig.narration.intro1), gameConfig.audioFiles.intro);
  };

  return (
    <div className="scene intro-scene" onClick={startAmbient} onTouchStart={startAmbient}>
      <Canvas camera={{ position: [0, 0.1, 3], fov: 45 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#03040a"]} />
        <fog attach="fog" args={["#03040a", 3, 10]} />
        <ambientLight intensity={0.08} />
        <Suspense fallback={null}>
          <Particles count={250} radius={6} color="#8fb3ff" size={0.03} />
          <Lantern />
        </Suspense>
        <CameraDrift mouse={mouse} />
      </Canvas>

      <div className="intro-overlay">
        <AnimatePresence mode="wait">
          {textStep >= 0 && textStep < lines.length && (
            <motion.p
              key={textStep}
              className="intro-line"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {lines[textStep]}
            </motion.p>
          )}
        </AnimatePresence>

        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="intro-cta"
          >
            <InteractiveButton
              onClick={() => {
                startAmbient();
                onBegin();
              }}
            >
              BEGIN THE HUNT
            </InteractiveButton>
            <button
              className="skip-audio-btn"
              onClick={(e) => {
                e.stopPropagation();
                AudioManager.setMuted(true);
                onBegin();
              }}
            >
              Continue without sound
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
