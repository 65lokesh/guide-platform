"use client";

import { useCallback, useRef, useState } from "react";

const SCRIPT = [
  "Hi, I'm your personal AI guide.",
  "Please select what you want in the terminal.",
];

export function useRobotVoice() {
  const [speaking, setSpeaking] = useState(false);
  const hasSpokenRef = useRef(false);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    setSpeaking(true);
    hasSpokenRef.current = true;

    SCRIPT.forEach((line, i) => {
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.rate = 0.95;
      utterance.pitch = 0.75;
      utterance.volume = 1;

      if (i === SCRIPT.length - 1) {
        utterance.onend = () => setSpeaking(false);
      }

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, i * 2600);
    });
  }, []);

  return { speak, speaking, hasSpoken: hasSpokenRef.current };
}
