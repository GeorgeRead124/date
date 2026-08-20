import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface VoiceControlProps {
  question: string;
  acceptedAnswers: string[];
  onResult: (correct: boolean) => void;
}

/** Optional voice puzzle — uses Web Speech API when available, else a text input */
export default function VoiceControl({ question, acceptedAnswers, onResult }: VoiceControlProps) {
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const checkAnswer = useCallback(
    (raw: string) => {
      const normalized = raw.trim().toLowerCase();
      const correct = acceptedAnswers.some((a) => normalized.includes(a.toLowerCase()));
      setFeedback(correct ? "Correct." : "Interesting answer... Try again.");
      onResult(correct);
    },
    [acceptedAnswers, onResult]
  );

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string;
      checkAnswer(transcript);
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <div className="voice-control">
      <p className="voice-question">{question}</p>

      {SpeechRecognition ? (
        <motion.button
          className={`voice-mic ${listening ? "listening" : ""}`}
          onClick={startListening}
          whileTap={{ scale: 0.95 }}
        >
          🎙️ {listening ? "Listening..." : "Talk to me"}
        </motion.button>
      ) : null}

      <div className="voice-fallback">
        <input
          type="text"
          value={textAnswer}
          placeholder="...or type your answer"
          onChange={(e) => setTextAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && textAnswer.trim()) checkAnswer(textAnswer);
          }}
        />
        <button
          onClick={() => {
            if (textAnswer.trim()) checkAnswer(textAnswer);
          }}
        >
          Send
        </button>
      </div>

      {feedback && <p className="voice-feedback">{feedback}</p>}
    </div>
  );
}
