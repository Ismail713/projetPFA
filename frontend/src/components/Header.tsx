"use client";

import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Comment ça marche", href: "#how-it-works" },
  { label: "Tarifs", href: "#pricing" },
  { label: "Galerie", href: "#gallery" },
] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        {/* ── Logo ─────────────────────────────────── */}
        <a href="/" className="flex items-center gap-2.5 group shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 font-display text-sm font-bold text-white transition-shadow group-hover:shadow-glow-sm select-none">
            SM
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            <span className="text-accent-500 dark:text-accent-400">SM</span>
            artMatch
            <span className="text-slate-400 dark:text-surface-400 font-semibold ml-0.5">
              CV
            </span>
          </span>
        </a>

        {/* ── Desktop nav ──────────────────────────── */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 hover:bg-slate-100/70 dark:text-surface-300 dark:hover:text-white dark:hover:bg-surface-700/40"
            >
              {label}
            </a>
          ))}
        </div>

        {/* ── Right actions ─────────────────────────── */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2 ml-1">
            <a
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 hover:bg-slate-100/70 dark:text-surface-200 dark:hover:text-white dark:hover:bg-surface-700/40"
            >
              Se connecter
            </a>
            <a
              href="/register"
              className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-600 hover:shadow-glow-sm active:scale-[0.97]"
            >
              Commencer gratuitement
            </a>
          </div>

          {/* ── Mobile menu button ──────────────────── */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            className="lg:hidden relative ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-surface-300 dark:hover:bg-surface-700/50 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile menu panel ────────────────────── */}
      <div
        className={`
          lg:hidden overflow-hidden transition-all duration-300 ease-in-out
          ${mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="border-t border-slate-200/60 dark:border-surface-600/20 px-6 pb-5 pt-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-surface-200 dark:hover:bg-surface-700/40"
            >
              {label}
            </a>
          ))}

          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/60 dark:border-surface-600/20 pt-4">
            <a
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-slate-300 dark:border-surface-600 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-surface-200 dark:hover:bg-surface-700/40"
            >
              Se connecter
            </a>
            <a
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-accent-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-accent-600 active:scale-[0.97]"
            >
              Commencer gratuitement
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
