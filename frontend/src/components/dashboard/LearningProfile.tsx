"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface JobCount {
  job_title: string;
  count: number;
}

interface FeedbackStats {
  total: number;
  relevant_count: number;
  not_relevant_count: number;
  applied_count: number;
  top_relevant_jobs: JobCount[];
  top_irrelevant_jobs: JobCount[];
}

function DonutChart({ relevant, notRelevant }: { relevant: number; notRelevant: number }) {
  const total = relevant + notRelevant;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const relevantLength = total > 0 ? (relevant / total) * circumference : 0;

  return (
    <div className="relative h-32 w-32 flex-shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="14"
          className="stroke-slate-200 dark:stroke-surface-700"
        />
        {total > 0 && (
          <>
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
              stroke="#34D399"
              strokeDasharray={`${relevantLength} ${circumference - relevantLength}`}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
              stroke="#F87171"
              strokeDasharray={`${circumference - relevantLength} ${relevantLength}`}
              strokeDashoffset={-relevantLength}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {total}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-surface-400">avis</span>
      </div>
    </div>
  );
}

function JobList({
  title,
  items,
  variant,
}: {
  title: string;
  items: JobCount[];
  variant: "green" | "red";
}) {
  if (items.length === 0) return null;
  const dot = variant === "green" ? "bg-emerald-400" : "bg-red-400";

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-surface-500 mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.job_title}
            className="flex items-center justify-between gap-2 text-sm text-slate-700 dark:text-surface-200"
          >
            <span className="flex items-center gap-2 truncate">
              <span className={`h-1.5 w-1.5 rounded-full ${dot} flex-shrink-0`} />
              <span className="truncate">{item.job_title}</span>
            </span>
            <span className="text-xs text-slate-400 dark:text-surface-500 flex-shrink-0">
              {item.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LearningProfile() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "empty" | "error">("loading");

  const fetchStats = useCallback(async () => {
    if (!token) {
      setStatus("empty");
      return;
    }
    try {
      const res = await fetch("/api/feedback/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: FeedbackStats = await res.json();
      setStats(data);
      setStatus(data.total > 0 ? "done" : "empty");
    } catch {
      setStatus("error");
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!user || status === "loading" || status === "error") return null;

  if (status === "empty" || !stats) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-card-light dark:glass dark:shadow-card dark:border-transparent p-6 lg:p-8 animate-fade-in">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
          Vos préférences apprises par l&apos;IA
        </h3>
        <p className="text-sm text-slate-500 dark:text-surface-400">
          Donnez votre avis sur les offres pour que l&apos;IA apprenne vos préférences.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-card-light dark:glass dark:shadow-card dark:border-transparent p-6 lg:p-8 animate-fade-in">
      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1">
        Vos préférences apprises par l&apos;IA
      </h3>
      <p className="text-sm text-slate-500 dark:text-surface-400 mb-6">
        L&apos;IA améliore vos résultats au fil du temps.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <DonutChart relevant={stats.relevant_count} notRelevant={stats.not_relevant_count} />

        <div className="flex gap-6 text-sm">
          <div>
            <span className="flex items-center gap-2 text-slate-600 dark:text-surface-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Pertinent
            </span>
            <span className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {stats.relevant_count}
            </span>
          </div>
          <div>
            <span className="flex items-center gap-2 text-slate-600 dark:text-surface-300">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Non pertinent
            </span>
            <span className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {stats.not_relevant_count}
            </span>
          </div>
          <div>
            <span className="flex items-center gap-2 text-slate-600 dark:text-surface-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" /> Postulé
            </span>
            <span className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {stats.applied_count}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <JobList title="Offres appréciées" items={stats.top_relevant_jobs} variant="green" />
        <JobList title="Offres rejetées" items={stats.top_irrelevant_jobs} variant="red" />
      </div>
    </div>
  );
}
