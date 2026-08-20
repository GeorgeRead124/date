import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "../effects/Particles";
import { gameConfig } from "../../config/gameConfig";
import { AudioManager } from "../audio/AudioManager";

interface PhotoFrameProps {
  src: string;
  caption: string;
  position: [number, number, number];
  index: number;
  onEnlarge: (index: number) => void;
}

function PhotoTexturePlane({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      src,
      (tex) => {
        if (!cancelled) setTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) setFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (failed || !texture) {
    return (
      <mesh>
        <planeGeometry args={[1.4, 1.05]} />
        <meshStandardMaterial color="#22283a" emissive="#3a4a6a" emissiveIntensity={0.3} />
      </mesh>
    );
  }

  return (
    <mesh>
      <planeGeometry args={[1.4, 1.05]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

function PhotoFrame({ src, position, index, onEnlarge }: PhotoFrameProps) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.2 + index) * 0.15;
    group.current.position.y = position[1] + Math.sin(t * 0.5 + index * 1.3) * 0.1;
    const targetScale = hovered ? 1.15 : 1;
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
  });

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={() => {
        setHovered(true);
        AudioManager.playTone("hover");
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={() => onEnlarge(index)}
    >
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[1.55, 1.2]} />
        <meshStandardMaterial color="#d8c093" />
      </mesh>
      <Suspense fallback={null}>
        <PhotoTexturePlane src={src} />
      </Suspense>
      <sprite position={[0, -0.75, 0]} scale={[1.6, 0.3, 1]}>
        <spriteMaterial color="#f5e6c8" transparent opacity={hovered ? 1 : 0.6} />
      </sprite>
    </group>
  );
}

interface MemorySceneProps {
  onFinished: () => void;
}

export default function MemoryScene({ onFinished }: MemorySceneProps) {
  const [enlarged, setEnlarged] = useState<number | null>(null);
  const [showSignoff, setShowSignoff] = useState(false);
  const [introText, setIntroText] = useState(0);

  const photos = gameConfig.photos;
  const radius = 3.4;

  const introLines = [
    gameConfig.narration.finalMessage1,
    gameConfig.narration.finalMessage2,
    gameConfig.narration.finalMessage3,
  ];

  useEffect(() => {
    const timers = introLines.map((_, i) => setTimeout(() => setIntroText(i + 1), 1000 + i * 1800));
    const gallery = setTimeout(() => setIntroText(introLines.length + 1), 1000 + introLines.length * 1800 + 1000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(gallery);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="scene memory-scene">
      <Canvas camera={{ position: [0, 0, 6.5], fov: 45 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#05050a"]} />
        <fog attach="fog" args={["#05050a", 6, 14]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 3, 3]} intensity={0.8} color="#ffd9a0" />
        <Suspense fallback={null}>
          <Particles count={200} radius={7} color="#bcd4ff" size={0.03} />
          {introText > introLines.length &&
            photos.map((p, i) => {
              const angle = (i / photos.length) * Math.PI * 2;
              const pos: [number, number, number] = [
                Math.sin(angle) * radius,
                Math.cos(i * 1.7) * 0.6,
                Math.cos(angle) * radius - 1,
              ];
              return (
                <PhotoFrame
                  key={p.src}
                  src={p.src}
                  caption={p.caption}
                  position={pos}
                  index={i}
                  onEnlarge={setEnlarged}
                />
              );
            })}
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {introText <= introLines.length && (
          <motion.div className="intro-overlay" exit={{ opacity: 0 }}>
            <AnimatePresence mode="wait">
              {introText > 0 && (
                <motion.p
                  key={introText}
                  className="intro-line"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 1 }}
                >
                  {introLines[introText - 1]}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {enlarged !== null && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnlarged(null)}
          >
            <motion.div
              className="lightbox-card"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="lightbox-image-placeholder">
                <img
                  src={photos[enlarged].src}
                  alt={photos[enlarged].caption}
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              </div>
              <p>{photos[enlarged].caption}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {introText > introLines.length && !showSignoff && (
        <motion.button
          className="gallery-continue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => setShowSignoff(true)}
        >
          I've seen enough for now →
        </motion.button>
      )}

      <AnimatePresence>
        {showSignoff && (
          <motion.div
            className="signoff-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <h2>{gameConfig.narration.gallerySignoff}</h2>
            <button onClick={onFinished}>Close</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
