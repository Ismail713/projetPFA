"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MatchCard, { type MatchResult } from "./MatchCard";

type Status = "loading" | "processing" | "done" | "empty" | "error";

interface ApiResponse {
  status?: "processing" | "done";
  matches?: MatchResult[];
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 dark:border-transparent dark:glass p-6 animate-pulse flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-surface-700/60 flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-3">
          <div className="h-4 w-3/4 rounded-full bg-slate-100 dark:bg-surface-700/60" />
          <div className="h-3 w-1/2 rounded-full bg-slate-100 dark:bg-surface-700/60" />
        </div>
        <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-surface-700/60" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <div className="h-2.5 w-16 rounded-full bg-slate-100 dark:bg-surface-700/60" />
          <div className="h-2.5 w-full rounded-full bg-slate-50 dark:bg-surface-700/40" />
          <div className="h-2.5 w-5/6 rounded-full bg-slate-50 dark:bg-surface-700/40" />
          <div className="h-2.5 w-4/6 rounded-full bg-slate-50 dark:bg-surface-700/40" />
        </div>
        <div className="space-y-2.5">
          <div className="h-2.5 w-16 rounded-full bg-slate-100 dark:bg-surface-700/60" />
          <div className="h-2.5 w-full rounded-full bg-slate-50 dark:bg-surface-700/40" />
          <div className="h-2.5 w-5/6 rounded-full bg-slate-50 dark:bg-surface-700/40" />
        </div>
      </div>
      <div className="h-2.5 w-2/3 rounded-full bg-slate-50 dark:bg-surface-700/40" />
      <div className="h-10 w-32 rounded-lg bg-slate-100 dark:bg-surface-700/60" />
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-accent-500 dark:text-accent-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function MatchesList() {
  const [status, setStatus] = useState<Status>("loading");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);

      const data: ApiResponse = await res.json();

      if (data.status === "processing") {
        setStatus("processing");
        return;
      }

      stopPolling();

      const results =
        data.matches ?? (Array.isArray(data) ? (data as MatchResult[]) : []);

      if (results.length === 0) {
        setStatus("empty");
      } else {
        setMatches(results.sort((a, b) => b.score - a.score));
        setStatus("done");
      }
    } catch (err) {
      stopPolling();
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Impossible de charger les résultats."
      );
      setStatus("error");
    }
  }, [stopPolling]);

  useEffect(() => {
    fetchMatches().then(() => {
      pollingRef.current = setInterval(fetchMatches, 5000);
    });
    return stopPolling;
  }, [fetchMatches, stopPolling]);

  if (status === "loading") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
        <div className="rounded-full bg-accent-50 dark:bg-accent-500/10 p-4">
          <Spinner />
        </div>
        <div className="text-center">
          <p className="font-display text-sm font-semibold text-slate-700 dark:text-surface-200">
            Analyse en cours
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-surface-500">
            Recherche des meilleures correspondances...
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-5 py-20 animate-fade-in">
        <div className="rounded-full bg-red-50 dark:bg-match-skip-muted/30 p-4">
          <svg
            className="h-6 w-6 text-red-500 dark:text-match-skip"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-600 dark:text-surface-300">
          {errorMsg}
        </p>
        <button
          onClick={() => {
            setStatus("loading");
            setErrorMsg(null);
            fetchMatches().then(() => {
              pollingRef.current = setInterval(fetchMatches, 5000);
            });
          }}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700 dark:hover:border-surface-500"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
        <div className="rounded-full bg-slate-100 dark:bg-surface-800 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-slate-400 dark:text-surface-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-display text-sm font-semibold text-slate-600 dark:text-surface-300">
            Aucun résultat
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-surface-500">
            Aucune offre correspondante trouvée pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {matches.map((match) => (
        <MatchCard key={match.url} match={match} />
      ))}
    </div>
  );
}
