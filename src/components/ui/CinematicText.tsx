import { motion, AnimatePresence } from "framer-motion";

interface CinematicTextProps {
  lines: string[];
  activeIndex: number;
  className?: string;
}

/** Shows one line at a time, fading gracefully between them */
export default function CinematicText({ lines, activeIndex, className = "" }: CinematicTextProps) {
  return (
    <div className={`cinematic-text ${className}`}>
      <AnimatePresence mode="wait">
        {activeIndex >= 0 && activeIndex < lines.length && (
          <motion.p
            key={activeIndex}
            initial={{ opacity: 0, y: 12, letterSpacing: "0.15em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.02em" }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {lines[activeIndex]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
