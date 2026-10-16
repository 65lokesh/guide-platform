"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import TypewriterText from "./TypewriterText";
import HeroTerminal from "./HeroTerminal";
import RobotVoiceButton from "./RobotVoiceButton";
import { heroTheme } from "./heroTheme";

const RobotAvatar = dynamic(() => import("./RobotAvatar"), { ssr: false });

const pill = "text-center text-sm rounded-full px-5 py-2.5 border transition-opacity hover:opacity-70";

export default function Hero() {
  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 38% 58%, ${heroTheme.bgCenter} 0%, ${heroTheme.bgEdge} 100%)`,
        color: heroTheme.text,
      }}
    >
      <div className="absolute inset-y-0 right-0 w-full md:w-[62%] pointer-events-none">
        <RobotAvatar />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col justify-end gap-7 px-6 pb-14 pt-32 md:max-w-[46%]">
        <div>
          <p
            aria-hidden
            className="text-base mb-3 select-none"
            style={{ filter: "blur(5px)", color: heroTheme.textMuted }}
          >
            Hi there, I&apos;m Guide, your personal AI assistant.
          </p>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight leading-tight min-h-[7.5rem]">
            <TypewriterText text="I was just indexing a thousand guides. Then you walked in." />
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="#categories"
            className={pill}
            style={{ background: heroTheme.pillBg, color: heroTheme.pillText, borderColor: heroTheme.pillBorder }}
          >
            Explore categories
          </Link>
          <Link
            href="/chat"
            className={pill}
            style={{ background: heroTheme.pillBg, color: heroTheme.pillText, borderColor: heroTheme.pillBorder }}
          >
            Ask the AI
          </Link>
          <Link
            href="/signup"
            className={pill}
            style={{ background: heroTheme.pillBg, color: heroTheme.pillText, borderColor: heroTheme.pillBorder }}
          >
            Create account
          </Link>
          <Link
            href="/login"
            className={pill}
            style={{ background: heroTheme.pillBg, color: heroTheme.pillText, borderColor: heroTheme.pillBorder }}
          >
            Log in
          </Link>
        </div>

        <RobotVoiceButton />
        <HeroTerminal />
      </div>
    </section>
  );
}
