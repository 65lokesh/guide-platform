"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { authTheme as t } from "./authTheme";

const RobotPanel = dynamic(() => import("./RobotPanel"), { ssr: false });

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm outline-none border transition-colors placeholder:text-black/40 focus:border-black/40";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 pt-24"
      style={{
        background: `radial-gradient(ellipse at 38% 58%, ${t.pageBgCenter} 0%, ${t.pageBgEdge} 100%)`,
        color: t.text,
      }}
    >
      <div
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[28px] border backdrop-blur-md"
        style={{ background: t.cardBg, borderColor: t.cardBorder }}
      >
        <div className="relative hidden md:block m-3 rounded-[20px] overflow-hidden bg-gradient-to-br from-[#2a2d38] to-[#1a1c24] border border-white/10">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/models/night.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0">
            <RobotPanel />
          </div>
        </div>

        <div className="flex flex-col justify-center px-8 py-12 sm:px-12">
          <h1 className="text-2xl font-semibold mb-6">Welcome back</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
            />
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
            />

            {error && (
              <p className="text-sm" style={{ color: t.error }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: t.buttonBg, color: t.buttonText }}
            >
              {loading ? "Logging in..." : "Continue with Email"}
            </button>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border transition-opacity hover:opacity-80"
              style={{ background: t.secondaryBg, color: t.secondaryText, borderColor: t.inputBorder }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <p className="mt-6 text-sm" style={{ color: t.textMuted }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium underline" style={{ color: t.text }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.35-1.7 3.96-5.5 3.96-3.31 0-6.02-2.74-6.02-6.12S8.69 5.82 12 5.82c1.89 0 3.16.8 3.88 1.49l2.65-2.55C16.9 3.15 14.68 2.1 12 2.1 6.9 2.1 2.75 6.31 2.75 12S6.9 21.9 12 21.9c6.92 0 8.94-4.86 8.94-7.36 0-.49-.05-.87-.12-1.24H12z"
      />
    </svg>
  );
}
