"use client";

import { useState, type ReactNode } from "react";

export default function ResultsTabs({
  analysisPanel,
  offersPanel,
}: {
  analysisPanel: ReactNode;
  offersPanel: ReactNode;
}) {
  const [tab, setTab] = useState<"analysis" | "offers">("analysis");
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/matches", { method: "DELETE" });
      if (res.ok) window.location.reload();
    } catch (e) {
      void e;
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex rounded-xl bg-slate-100 dark:bg-surface-800 p-1">
          <button
            onClick={() => setTab("analysis")}
            className={
              "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 " +
              (tab === "analysis"
                ? "bg-white text-slate-900 shadow-sm dark:bg-surface-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-surface-400 dark:hover:text-surface-200")
            }
          >
            Analyse CV
          </button>
          <button
            onClick={() => setTab("offers")}
            className={
              "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 " +
              (tab === "offers"
                ? "bg-white text-slate-900 shadow-sm dark:bg-surface-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-surface-400 dark:hover:text-surface-200")
            }
          >
            {"Offres d'emploi"}
          </button>
        </div>

        <button
          onClick={handleClear}
          disabled={clearing}
          className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-100 hover:border-red-400 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 disabled:opacity-50"
        >
          Effacer
        </button>
      </div>

      <div style={{ display: tab === "analysis" ? "block" : "none" }}>
        {analysisPanel}
      </div>
      <div style={{ display: tab === "offers" ? "block" : "none" }}>
        {offersPanel}
      </div>
    </>
  );
}
