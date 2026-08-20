import { motion } from "framer-motion";
import { AudioManager } from "../audio/AudioManager";

interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}

export default function InteractiveButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: InteractiveButtonProps) {
  return (
    <motion.button
      className={`ibtn ibtn-${variant}`}
      disabled={disabled}
      onMouseEnter={() => AudioManager.playTone("hover")}
      onClick={() => {
        AudioManager.unlock();
        AudioManager.playTone("click");
        onClick();
      }}
      whileHover={{ scale: 1.045, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
    >
      <span className="ibtn-glow" />
      <span className="ibtn-label">{children}</span>
    </motion.button>
  );
}
