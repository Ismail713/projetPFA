"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Analysis {
  cv_score: number;
  overall_assessment: string;
  strengths: string[];
  weaknesses: string[];
  missing_sections: string[];
  suggestions_to_add: string[];
  suggestions_to_remove: string[];
  suggestions_to_improve: string[];
  keywords_to_add: string[];
  rewrite_tips: string[];
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "#34D399" : score >= 45 ? "#FBBF24" : "#F87171";

  return (
    <div className="relative h-32 w-32 flex-shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-surface-700" />
        <circle
          cx="60" cy="60" r={radius} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-slate-900 dark:text-white">{score}</span>
        <span className="text-xs text-slate-400 dark:text-surface-400">/ 100</span>
      </div>
    </div>
  );
}

function Tag({ children, variant }: { children: React.ReactNode; variant: "green" | "red" | "blue" | "yellow" | "purple" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    red: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    yellow: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    purple: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  };
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

function Section({ title, icon, items, variant }: { title: string; icon: string; items: string[]; variant: "green" | "red" | "blue" | "yellow" | "purple" }) {
  if (!items || items.length === 0) return null;
  const dotColor = {
    green: "bg-emerald-400", red: "bg-red-400", blue: "bg-blue-400", yellow: "bg-amber-400", purple: "bg-purple-400",
  };
  return (
    <div>
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-surface-500 mb-3">
        <span>{icon}</span> {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-surface-200">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dotColor[variant]} flex-shrink-0`} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CVAnalysis() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<"loading" | "empty" | "done">("loading");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await fetch("/api/cv/analysis/latest");
      if (!res.ok) {
        if (res.status === 404) return;
        setStatus("empty"); stopPolling(); return;
      }

      const raw = await res.json();
      if (raw.cv_score === 0 && raw.overall_assessment === "Analysis unavailable") {
        return;
      }

      const toArray = (v: unknown): string[] => {
        if (Array.isArray(v)) return v;
        if (typeof v === "string" && v.length > 0) return [v];
        return [];
      };

      const result: Analysis = {
        cv_score: raw.cv_score ?? 0,
        overall_assessment: raw.overall_assessment ?? "",
        strengths: toArray(raw.strengths),
        weaknesses: toArray(raw.weaknesses),
        missing_sections: toArray(raw.missing_sections),
        suggestions_to_add: toArray(raw.suggestions_to_add),
        suggestions_to_remove: toArray(raw.suggestions_to_remove),
        suggestions_to_improve: toArray(raw.suggestions_to_improve),
        keywords_to_add: toArray(raw.keywords_to_add),
        rewrite_tips: toArray(raw.rewrite_tips),
      };

      setAnalysis(result);
      setStatus("done");
      stopPolling();
    } catch {
      /* keep polling */
    }
  }, [stopPolling]);

  useEffect(() => {
    fetchAnalysis();
    pollingRef.current = setInterval(fetchAnalysis, 5000);
    return stopPolling;
  }, [fetchAnalysis, stopPolling]);

  if (status === "loading" || (status !== "done" && !analysis)) {
    return null;
  }

  if (!analysis) return null;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-card-light dark:glass dark:shadow-card dark:border-transparent p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <ScoreRing score={analysis.cv_score} />
        <div className="text-center sm:text-left flex-1">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
            Score de votre CV
          </h3>
          <p className="text-sm text-slate-600 dark:text-surface-300 leading-relaxed">
            {analysis.overall_assessment}
          </p>
        </div>
      </div>

      {/* Keywords to add */}
      {analysis.keywords_to_add && analysis.keywords_to_add.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-surface-500 mb-3">
            Mots-clés à ajouter
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords_to_add.map((kw, i) => (
              <Tag key={i} variant="purple">{kw}</Tag>
            ))}
          </div>
        </div>
      )}

      {/* Grid sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Points forts" icon="+" items={analysis.strengths} variant="green" />
        <Section title="Points faibles" icon="-" items={analysis.weaknesses} variant="red" />
        <Section title="À ajouter" icon="+" items={analysis.suggestions_to_add} variant="blue" />
        <Section title="À supprimer" icon="-" items={analysis.suggestions_to_remove} variant="yellow" />
        <Section title="À améliorer" icon="*" items={analysis.suggestions_to_improve} variant="blue" />
        <Section title="Sections manquantes" icon="!" items={analysis.missing_sections} variant="red" />
      </div>

      {/* Rewrite tips */}
      {analysis.rewrite_tips && analysis.rewrite_tips.length > 0 && (
        <div className="mt-6 rounded-xl bg-slate-50 dark:bg-surface-800/50 border border-slate-100 dark:border-surface-700 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-surface-500 mb-3">
            Conseils de réécriture
          </h4>
          <ul className="space-y-2">
            {analysis.rewrite_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-surface-300">
                <span className="mt-0.5 text-accent-500">→</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
