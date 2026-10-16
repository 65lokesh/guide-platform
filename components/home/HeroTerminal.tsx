"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BOOT_LINES = [
  "booting guide-search v1.0...",
  "connecting to database... ok",
  "indexing categories... done",
  "ready.",
];

export default function HeroTerminal() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "not-found">("idle");
  const [bootedLines, setBootedLines] = useState<string[]>([]);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setBootedLines(BOOT_LINES.slice(0, i));
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setTimeout(() => setBooted(true), 300);
      }
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus("searching");

    const res = await fetch(`/api/guides/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data?.categorySlug && data?.guideSlug) {
      router.push(`/${data.categorySlug}/${data.guideSlug}`);
    } else {
      setStatus("not-found");
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl bg-[#0b0c10] border border-white/10 font-mono text-sm overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10 bg-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 text-white/40 text-xs">guide-search</span>
      </div>
      <div className="p-4 min-h-[140px]">
        {!booted ? (
          <div className="flex flex-col gap-1 text-white/50">
            {bootedLines.map((line, i) => (
              <p key={i}>
                <span className="text-emerald-400">$</span> {line}
              </p>
            ))}
            <span className="inline-block w-[6px] h-[1em] bg-white/60 animate-pulse mt-1" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 text-white/40">
              <span className="text-emerald-400">$</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setStatus("idle");
                }}
                placeholder="which guide do you want?"
                className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none"
              />
            </div>
            {status === "searching" && <p className="text-white/30 mt-2">searching...</p>}
            {status === "not-found" && (
              <p className="text-red-400/80 mt-2">no match found — try browsing categories below</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
