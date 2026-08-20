import { motion } from "framer-motion";
import { useGame } from "../game/GameState";
import { progressForPhase } from "../game/GameState";
import { AudioManager } from "../audio/AudioManager";

const HIDDEN_PHASES = ["intro", "chestEmpty", "portal", "reveal"];

export default function ProgressHUD() {
  const { phase, muted, setMuted } = useGame();
  const pct = progressForPhase(phase);
  const hidden = HIDDEN_PHASES.includes(phase);

  return (
    <motion.div
      className="hud"
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? -12 : 0 }}
      transition={{ duration: 0.6 }}
      style={{ pointerEvents: hidden ? "none" : "auto" }}
    >
      <div className="hud-title">THE SECRET TREASURE</div>
      <div className="hud-progress-track">
        <motion.div
          className="hud-progress-fill"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <button
        className="hud-mute"
        onClick={() => {
          const next = !muted;
          setMuted(next);
          AudioManager.setMuted(next);
        }}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </motion.div>
  );
}
