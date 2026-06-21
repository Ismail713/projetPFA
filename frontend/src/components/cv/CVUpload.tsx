"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const STATUS_MESSAGES = [
  "Analyse de votre CV en cours...",
  "Génération des requêtes de recherche...",
  "Recherche des offres correspondantes...",
];

type Phase = "idle" | "uploading" | "polling" | "done" | "error";

export default function CVUpload() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [matches, setMatches] = useState<unknown[] | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (statusRef.current) {
      clearInterval(statusRef.current);
      statusRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  function validate(file: File): string | null {
    if (file.type !== "application/pdf") {
      return "Seuls les fichiers PDF sont acceptés.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Le fichier dépasse la taille maximale de 10 Mo.";
    }
    return null;
  }

  function startStatusRotation() {
    setStatusIndex(0);
    statusRef.current = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3000);
  }

  function startPolling() {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/matches");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          clearTimers();
          setMatches(data);
          setPhase("done");
        }
      } catch {
        // keep polling
      }
    }, 5000);
  }

  async function handleFile(file: File) {
    setError(null);
    setMatches(null);

    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPhase("uploading");
    startStatusRotation();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }

      setPhase("polling");
      startPolling();
    } catch (err) {
      clearTimers();
      setPhase("error");
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'upload."
      );
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  const isProcessing = phase === "uploading" || phase === "polling";

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto animate-fade-in">
      <div
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isProcessing) inputRef.current?.click();
          }
        }}
        className={`
          relative w-full rounded-2xl border-2 border-dashed p-12
          flex flex-col items-center gap-5
          transition-all duration-300 cursor-pointer
          gradient-border
          ${
            dragOver
              ? "border-accent-400 bg-accent-50 shadow-glow-sm dark:bg-accent-500/10 dark:shadow-glow"
              : "border-slate-300 bg-white hover:border-accent-400/50 hover:bg-slate-50 hover:shadow-card-light dark:border-surface-600 dark:bg-surface-800/50 dark:hover:border-accent-500/40 dark:hover:bg-surface-800/80 dark:hover:shadow-glow-sm"
          }
          ${isProcessing ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <div
          className={`
          rounded-xl p-4 transition-colors duration-300
          ${
            dragOver
              ? "bg-accent-100 dark:bg-accent-500/15"
              : "bg-slate-100 dark:bg-surface-700/50"
          }
        `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-10 w-10 transition-colors duration-300 ${
              dragOver
                ? "text-accent-500 dark:text-accent-400"
                : "text-slate-400 dark:text-surface-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="font-display text-sm font-semibold text-slate-700 dark:text-surface-200">
            Déposez votre CV ici
          </p>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-surface-500">
            PDF uniquement &middot; 10 Mo maximum
          </p>
        </div>

        <span className="rounded-lg bg-accent-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-500">
          Parcourir
        </span>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 dark:bg-match-skip-muted/40 dark:border-match-skip/20 px-4 py-2.5">
          <svg
            className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-match-skip"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-red-600 dark:text-match-skip text-sm">{error}</p>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-3 rounded-lg bg-accent-50 border border-accent-200 dark:bg-accent-500/10 dark:border-accent-500/20 px-5 py-3">
          <svg
            className="h-4 w-4 animate-spin text-accent-500 dark:text-accent-400"
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
          <span className="text-sm text-accent-700 dark:text-accent-200">
            {STATUS_MESSAGES[statusIndex]}
          </span>
        </div>
      )}

      {phase === "done" && matches && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-match-apply-muted/40 dark:border-match-apply/20 px-4 py-2.5">
          <svg
            className="h-4 w-4 flex-shrink-0 text-emerald-500 dark:text-match-apply"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-emerald-700 dark:text-match-apply text-sm">
            {matches.length} offre{matches.length > 1 ? "s" : ""} correspondante
            {matches.length > 1 ? "s" : ""} trouvée
            {matches.length > 1 ? "s" : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
