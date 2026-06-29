"use client";

import { useState } from "react";

const GALLERY_ITEMS = [
  {
    title: "Analyse intelligente du CV",
    description:
      "Notre IA extrait automatiquement vos compétences, expériences et formations.",
    icon: "doc",
    accent: "from-accent-500 to-accent-400",
    accentBg: "bg-accent-500/10",
    accentBorder: "border-accent-500/20",
    accentText: "text-accent-400",
  },
  {
    title: "Matching en temps réel",
    description:
      "Des centaines d'offres comparées instantanément avec votre profil.",
    icon: "match",
    accent: "from-emerald-500 to-teal-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
    accentText: "text-emerald-400",
  },
  {
    title: "Score de compatibilité",
    description:
      "Un pourcentage précis pour chaque offre, basé sur vos compétences.",
    icon: "score",
    accent: "from-violet-500 to-purple-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/20",
    accentText: "text-violet-400",
  },
  {
    title: "Tableau de bord personnalisé",
    description:
      "Suivez vos candidatures et consultez vos résultats en un clin d'œil.",
    icon: "dashboard",
    accent: "from-amber-500 to-orange-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/20",
    accentText: "text-amber-400",
  },
  {
    title: "Recommandations ciblées",
    description:
      "Recevez des suggestions d'amélioration pour booster votre profil.",
    icon: "target",
    accent: "from-rose-500 to-pink-400",
    accentBg: "bg-rose-500/10",
    accentBorder: "border-rose-500/20",
    accentText: "text-rose-400",
  },
  {
    title: "Multi-format supporté",
    description:
      "Importez vos CV en PDF, Word ou texte brut — nous gérons tout.",
    icon: "file",
    accent: "from-cyan-500 to-sky-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/20",
    accentText: "text-cyan-400",
  },
] as const;

function GalleryIcon({ type, className }: { type: string; className?: string }) {
  const props = {
    className: className || "h-8 w-8",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.5,
  };

  switch (type) {
    case "doc":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
    case "match":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
      );
    case "score":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
      );
    case "target":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function GallerySection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      id="gallery"
      className="relative border-y border-slate-200/70 dark:border-surface-700/40 bg-slate-100/50 dark:bg-surface-900/50"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.04)_1px,_transparent_0)] [background-size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.06)_1px,_transparent_0)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {/* heading */}
        <div className="text-center mb-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-500 dark:text-accent-400">
            Fonctionnalit&eacute;s
          </p>
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl text-balance">
            Ce que SmartMatch peut faire pour vous
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-500 dark:text-surface-400">
            D&eacute;couvrez les outils qui transforment votre recherche d&apos;emploi
            en une exp&eacute;rience intelligente et personnalis&eacute;e.
          </p>
        </div>

        {/* gallery grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY_ITEMS.map((item, i) => (
            <div
              key={item.title}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`
                group relative overflow-hidden rounded-2xl border
                bg-white dark:bg-surface-800/60
                transition-all duration-300 ease-out
                ${
                  hoveredIndex === i
                    ? `${item.accentBorder} shadow-lg scale-[1.02]`
                    : "border-slate-200/80 dark:border-surface-700/50 shadow-sm"
                }
              `}
            >
              {/* gradient top bar */}
              <div
                className={`h-1 w-full bg-gradient-to-r ${item.accent} transition-opacity duration-300 ${
                  hoveredIndex === i ? "opacity-100" : "opacity-0"
                }`}
              />

              <div className="px-6 pb-6 pt-5">
                {/* icon */}
                <div
                  className={`
                    mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl
                    ${item.accentBg} ${item.accentText}
                    transition-transform duration-300
                    ${hoveredIndex === i ? "scale-110" : ""}
                  `}
                >
                  <GalleryIcon type={item.icon} className="h-6 w-6" />
                </div>

                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-surface-400">
                  {item.description}
                </p>
              </div>

              {/* hover glow */}
              <div
                aria-hidden
                className={`
                  pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full
                  bg-gradient-to-br ${item.accent} blur-3xl
                  transition-opacity duration-500
                  ${hoveredIndex === i ? "opacity-10" : "opacity-0"}
                `}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
