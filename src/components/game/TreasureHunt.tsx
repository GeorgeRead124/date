import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameContext } from "./GameState";
import type { Phase } from "./GameState";
import ProgressHUD from "../ui/ProgressHUD";
import IntroScene from "../scenes/IntroScene";
import MapScene from "../scenes/MapScene";
import RoomScene from "../scenes/RoomScene";
import CaveScene from "../scenes/CaveScene";
import FinalScene from "../scenes/FinalScene";
import MemoryScene from "../scenes/MemoryScene";
import { AudioManager } from "../audio/AudioManager";

export default function TreasureHunt() {
  const [phase, setPhaseState] = useState<Phase>("intro");
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  const [crystalsLit, setCrystalsLit] = useState<[boolean, boolean, boolean]>([false, false, false]);

  const setPhase = (p: Phase) => setPhaseState(p);
  const setCrystalLit = (index: number, lit: boolean) => {
    setCrystalsLit((prev) => {
      const next: [boolean, boolean, boolean] = [...prev];
      next[index] = lit;
      return next;
    });
  };

  const finalGroup: Phase[] = ["chestEmpty", "portal", "path", "finalChest", "reveal"];
  const wrapperKey = finalGroup.includes(phase) ? "final-sequence" : phase;

  return (
    <GameContext.Provider
      value={{ phase, setPhase, muted, setMuted, reducedMotion, setReducedMotion, crystalsLit, setCrystalLit }}
    >
      <ProgressHUD />
      <AnimatePresence mode="wait">
        <motion.div
          key={wrapperKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="phase-wrapper"
        >
          {phase === "intro" && (
            <IntroScene
              onBegin={() => {
                AudioManager.playTone("whoosh");
                setPhase("map");
              }}
            />
          )}

          {phase === "map" && (
            <MapScene
              onSolved={() => {
                AudioManager.playTone("whoosh");
                setPhase("room");
              }}
            />
          )}

          {phase === "room" && (
            <RoomScene
              onSolved={() => {
                AudioManager.playTone("whoosh");
                setPhase("cave");
              }}
            />
          )}

          {phase === "cave" && (
            <CaveScene
              onChestOpened={() => {
                AudioManager.playTone("whoosh");
                setPhase("chestEmpty");
              }}
            />
          )}

          {(phase === "chestEmpty" ||
            phase === "portal" ||
            phase === "path" ||
            phase === "finalChest" ||
            phase === "reveal") && (
            <FinalScene
              onGalleryReady={() => {
                setPhase("gallery");
              }}
            />
          )}

          {phase === "gallery" && (
            <MemoryScene
              onFinished={() => {
                /* Experience complete — leave the gallery open as a keepsake */
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </GameContext.Provider>
  );
}
