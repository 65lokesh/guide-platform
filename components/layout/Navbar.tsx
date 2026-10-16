"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { heroTheme } from "@/components/home/heroTheme";

const NAV_LINKS = [
  { href: "/#categories", label: "Categories" },
  { href: "/chat", label: "Chat" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const { status } = useSession();
  const pathname = usePathname();

  // The home page (hero + categories) and the login page are light; everything else stays dark.
  const light = pathname === "/" || pathname === "/login";

  const base = "fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-5 transition-colors";
  const headerClass = light ? base : `${base} bg-black/80 backdrop-blur-sm`;
  const linkClass = light
    ? "hover:opacity-60 transition-opacity"
    : "text-white/70 hover:text-white transition-colors";

  return (
    <header className={headerClass} style={{ color: light ? heroTheme.text : "#ffffff" }}>
      <Link href="/" className="font-medium tracking-tight flex items-center gap-2">
        Guidely <span style={{ opacity: 0.4 }}>—</span>
      </Link>

      <nav className="hidden sm:flex items-center gap-8 text-sm">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4 text-sm">
        {status === "authenticated" ? (
          <button onClick={() => signOut()} className={linkClass}>
            Log out
          </button>
        ) : (
          <>
            <Link href="/login" className={linkClass}>
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={
                light
                  ? { background: heroTheme.text, color: "#ffffff" }
                  : { background: "#ffffff", color: "#000000" }
              }
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
