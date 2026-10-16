"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RobotPanel = dynamic(() => import("./RobotPanel"), { ssr: false });

type Interest = { id: string; name: string };
type CategoryWithInterests = { id: string; name: string; interests: Interest[] };

export default function InterestSelector() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithInterests[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/interests")
      .then((res) => res.json())
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    console.log("toggle fired for:", id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    setSaving(true);
    await fetch("/api/user/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interestIds: Array.from(selected) }),
    });
    setSaving(false);
    router.push("/");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6">
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[28px] bg-[#0b0c10] border border-white/10">
        <div className="relative hidden md:block m-3 rounded-[20px] overflow-hidden bg-gradient-to-br from-[#2a2d38] to-[#1a1c24] border border-white/10">
          <video
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            src="/models/night.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 pointer-events-none">
            <RobotPanel />
          </div>
        </div>

        <div className="relative z-20 flex flex-col justify-center px-8 py-12 sm:px-12">
          <h1 className="text-white text-2xl font-semibold mb-2">What are you here for?</h1>
          <p className="text-white/50 text-sm mb-6">
            Pick a few topics — this helps us recommend guides you&apos;ll actually want to read.
          </p>

          {loading ? (
            <p className="text-white/40 text-sm">Loading topics...</p>
          ) : (
            <div className="flex flex-col gap-5 max-h-[320px] overflow-y-auto pr-1">
              {categories.map((category) => (
                <div key={category.id}>
                  <h3 className="text-white/70 text-xs font-medium uppercase tracking-wide mb-2">
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {category.interests.map((interest) => {
                      const isSelected = selected.has(interest.id);
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggle(interest.id)}
                          className={`relative z-30 cursor-pointer px-3 py-1.5 rounded-full border text-sm transition-colors ${
                            isSelected
                              ? "bg-white text-black border-white"
                              : "bg-[#16181d] text-white/70 border-white/10 hover:border-white/30"
                          }`}
                        >
                          {interest.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={selected.size === 0 || saving}
            className="relative z-30 mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#ff8a65] to-[#ff5b7f] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
