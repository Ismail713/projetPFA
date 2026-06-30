"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export interface MatchResult {
  id: number;
  title: string;
  company: string;
  url: string;
  score: number;
  verdict: "Apply" | "Consider" | "Skip";
  matching_points: string[];
  missing_requirements: string[];
  strengths: string[];
  recommendation: string;
}

const FEEDBACK_CONFIG = {
  relevant: {
    label: "Pertinent",
    icon: "👍",
    activeClass: "bg-emerald-500 text-white border-emerald-500",
  },
  not_relevant: {
    label: "Non pertinent",
    icon: "👎",
    activeClass: "bg-red-500 text-white border-red-500",
  },
  applied: {
    label: "J'ai postulé",
    icon: "✅",
    activeClass: "bg-blue-500 text-white border-blue-500",
  },
} as const;

type FeedbackType = keyof typeof FEEDBACK_CONFIG;

function FeedbackBar({ matchId, jobTitle }: { matchId: number; jobTitle: string }) {
  const { token } = useAuth();
  const [sent, setSent] = useState<FeedbackType | null>(null);
  const [loading, setLoading] = useState<FeedbackType | null>(null);

  if (!token) return null;

  const sendFeedback = async (type: FeedbackType) => {
    if (sent || loading) return;
    setLoading(type);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchResultId: matchId, jobTitle, feedback: type }),
      });
      if (res.ok) setSent(type);
    } catch {
      /* ignore network errors, allow retry */
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-surface-700 pt-4">
      {(Object.keys(FEEDBACK_CONFIG) as FeedbackType[]).map((type) => {
        const { label, icon, activeClass } = FEEDBACK_CONFIG[type];
        const isActive = sent === type;
        const disabled = sent !== null || loading !== null;

        return (
          <button
            key={type}
            onClick={() => sendFeedback(type)}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              isActive
                ? activeClass
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-surface-600 dark:text-surface-400 dark:hover:text-surface-200"
            } ${disabled && !isActive ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <span>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

const VERDICT_CONFIG = {
  Apply: {
    stroke: "#34D399",
    trackVar: "var(--score-track-apply)",
    glow: "score-glow-apply",
    badge:
      "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-match-apply-muted/50 dark:text-match-apply dark:border-match-apply/25",
    label: "Postuler",
  },
  Consider: {
    stroke: "#FBBF24",
    trackVar: "var(--score-track-consider)",
    glow: "score-glow-consider",
    badge:
      "bg-amber-50 text-amber-600 border-amber-200 dark:bg-match-consider-muted/50 dark:text-match-consider dark:border-match-consider/25",
    label: "À considérer",
  },
  Skip: {
    stroke: "#F87171",
    trackVar: "var(--score-track-skip)",
    glow: "score-glow-skip",
    badge:
      "bg-red-50 text-red-500 border-red-200 dark:bg-match-skip-muted/50 dark:text-match-skip dark:border-match-skip/25",
    label: "Passer",
  },
} as const;

function verdictFor(score: number): keyof typeof VERDICT_CONFIG {
  if (score >= 70) return "Apply";
  if (score >= 45) return "Consider";
  return "Skip";
}

function ScoreCircle({
  score,
  verdict,
}: {
  score: number;
  verdict: keyof typeof VERDICT_CONFIG;
}) {
  const { stroke, trackVar, glow } = VERDICT_CONFIG[verdict];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative h-24 w-24 flex-shrink-0 ${glow}`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          stroke={trackVar}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-slate-900 dark:text-white leading-none">
          {score}
        </span>
        <span className="text-[10px] font-medium text-slate-400 dark:text-surface-400 mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}

export default function MatchCard({ match }: { match: MatchResult }) {
  const verdict = verdictFor(match.score);
  const { badge, label } = VERDICT_CONFIG[verdict];

  const strengths = match.strengths.slice(0, 3);
  const missing = match.missing_requirements.slice(0, 3);

  return (
    <div className="group rounded-2xl bg-white border border-slate-200 shadow-card-light transition-all duration-300 hover:shadow-card-light-hover hover:border-slate-300 dark:glass dark:shadow-card dark:hover:shadow-card-hover dark:hover:border-surface-500/30 dark:border-transparent p-6 flex flex-col gap-5 animate-slide-up">
      <div className="flex items-start gap-4">
        <ScoreCircle score={match.score} verdict={verdict} />

        <div className="flex-1 min-w-0 pt-1.5">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate leading-snug">
            {match.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-surface-400 mt-1">
            {match.company}
          </p>
        </div>

        <span
          className={`self-start rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap ${badge}`}
        >
          {label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {strengths.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-surface-500">
              Points forts
            </p>
            <ul className="space-y-1.5">
              {strengths.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2 text-slate-700 dark:text-surface-200"
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-match-apply flex-shrink-0" />
                  <span className="leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {missing.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-surface-500">
              Manquant
            </p>
            <ul className="space-y-1.5">
              {missing.map((m) => (
                <li
                  key={m}
                  className="flex items-start gap-2 text-slate-500 dark:text-surface-300"
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-match-skip/60 flex-shrink-0" />
                  <span className="leading-snug">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {match.recommendation && (
        <p className="text-sm leading-relaxed text-slate-500 dark:text-surface-400 border-l-2 border-slate-200 dark:border-surface-600 pl-3">
          {match.recommendation}
        </p>
      )}

      <a
        href={match.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-500 hover:shadow-glow-sm"
      >
        Voir l&apos;offre
        <svg
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </a>

      <FeedbackBar matchId={match.id} jobTitle={match.title} />
    </div>
  );
}
