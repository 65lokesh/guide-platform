"use client";

import { useRobotVoice } from "./useRobotVoice";
import { heroTheme } from "./heroTheme";

export default function RobotVoiceButton() {
  const { speak, speaking } = useRobotVoice();

  return (
    <button
      type="button"
      onClick={speak}
      disabled={speaking}
      className="flex items-center gap-2 text-xs transition-opacity hover:opacity-70 disabled:opacity-50 w-fit"
      style={{ color: heroTheme.textMuted }}
    >
      <span className={speaking ? "animate-pulse" : ""}>🔊</span>
      {speaking ? "Speaking..." : "Hear from your guide"}
    </button>
  );
}
