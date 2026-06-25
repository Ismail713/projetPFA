"use client";

import { useState } from "react";
import CVAnalysis from "@/components/cv/CVAnalysis";
import MatchesList from "@/components/jobs/MatchesList";

type Tab = "analysis" | "offers";

export default function ResultsSection() {
  const [activeTab, setActiveTab] = useState<Tab>("analysis");
  const [clearing, setClearing] = useState(false);

  const clearResults = async () => {
    if (!confirm("Supprimer tous les résultats ?")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/matches", { method: "DELETE" });
      if (res.ok) window.location.reload();
    } catch {
      /* ignore */
    } finally {
      setClearing(false);
    }
  };

  return (
    <section id="matches" className="mx-auto max-w-6xl px-6 pb-24">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-surface-600/60 to-transparent" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-surface-400">
          Résultats
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-surface-600/60 to-transparent" />
      </div>

      {/* Tabs + Clear button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex rounded-xl bg-slate-100 dark:bg-surface-800 p-1">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === "analysis"
                ? "bg-white text-slate-900 shadow-sm dark:bg-surface-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-surface-400 dark:hover:text-surface-200"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Analyse CV
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === "offers"
                ? "bg-white text-slate-900 shadow-sm dark:bg-surface-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-surface-400 dark:hover:text-surface-200"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Offres d{"'"}emploi
          </button>
        </div>

        <button
          onClick={clearResults}
          disabled={clearing}
          className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-100 hover:border-red-400 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Effacer
        </button>
      </div>

      {/* Content */}
      <div className={activeTab === "analysis" ? "block" : "hidden"}>
        <CVAnalysis />
      </div>
      <div className={activeTab === "offers" ? "block" : "hidden"}>
        <MatchesList />
      </div>
    </section>
  );
}
