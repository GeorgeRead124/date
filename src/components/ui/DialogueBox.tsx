import { motion, AnimatePresence } from "framer-motion";

interface DialogueBoxProps {
  text: string | null;
  position?: "top" | "bottom" | "center";
}

export default function DialogueBox({ text, position = "bottom" }: DialogueBoxProps) {
  return (
    <div className={`dialogue-wrap dialogue-${position}`}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={text}
            className="dialogue-box"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="dialogue-glyph">✦</span>
            <p>{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
