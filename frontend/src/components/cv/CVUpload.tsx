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
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
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
          w-full rounded-xl border-2 border-dashed p-10
          flex flex-col items-center gap-4
          transition-colors duration-200 cursor-pointer
          ${
            dragOver
              ? "border-blue-400 bg-blue-400/10"
              : "border-gray-600 bg-gray-800/50 hover:border-gray-400 hover:bg-gray-800"
          }
          ${isProcessing ? "pointer-events-none opacity-60" : ""}
        `}
      >
        {/* Upload icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-400"
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

        <p className="text-gray-300 text-center text-sm">
          Déposez votre CV (PDF) ici ou cliquez pour uploader
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {isProcessing && (
        <div className="flex items-center gap-3 text-blue-300 text-sm">
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
          <span>{STATUS_MESSAGES[statusIndex]}</span>
        </div>
      )}

      {phase === "done" && matches && (
        <p className="text-green-400 text-sm">
          {matches.length} offre{matches.length > 1 ? "s" : ""} correspondante
          {matches.length > 1 ? "s" : ""} trouvée{matches.length > 1 ? "s" : ""}.
        </p>
      )}
    </div>
  );
}
