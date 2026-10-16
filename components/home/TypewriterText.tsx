"use client";

import { useEffect, useState } from "react";

export default function TypewriterText({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <span className="inline-block w-[0.45em] h-[0.9em] bg-current align-middle ml-1 animate-pulse" />
    </span>
  );
}
