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
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 animate-pulse flex flex-col gap-5">
      <div className="flex items-start gap-5">
        <div className="h-28 w-28 rounded-full bg-gray-800 flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-5 w-3/4 rounded bg-gray-800" />
          <div className="h-4 w-1/2 rounded bg-gray-800" />
        </div>
        <div className="h-6 w-16 rounded-full bg-gray-800" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-gray-800" />
          <div className="h-3 w-5/6 rounded bg-gray-800" />
          <div className="h-3 w-4/6 rounded bg-gray-800" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-gray-800" />
          <div className="h-3 w-5/6 rounded bg-gray-800" />
          <div className="h-3 w-4/6 rounded bg-gray-800" />
        </div>
      </div>
      <div className="h-3 w-2/3 rounded bg-gray-800" />
      <div className="h-9 w-28 rounded-lg bg-gray-800" />
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
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

      const results = data.matches ?? (Array.isArray(data) ? (data as MatchResult[]) : []);

      if (results.length === 0) {
        setStatus("empty");
      } else {
        setMatches(results.sort((a, b) => b.score - a.score));
        setStatus("done");
      }
    } catch (err) {
      stopPolling();
      setErrorMsg(
        err instanceof Error ? err.message : "Impossible de charger les résultats."
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-blue-300">
        <Spinner />
        <p className="text-sm">Analyse en cours...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-red-400 text-sm">{errorMsg}</p>
        <button
          onClick={() => {
            setStatus("loading");
            setErrorMsg(null);
            fetchMatches().then(() => {
              pollingRef.current = setInterval(fetchMatches, 5000);
            });
          }}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
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
        <p className="text-sm">Aucune offre correspondante trouvée.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {matches.map((match) => (
        <MatchCard key={match.url} match={match} />
      ))}
    </div>
  );
}
