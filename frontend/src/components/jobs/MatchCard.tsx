export interface MatchResult {
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

const VERDICT_CONFIG = {
  Apply: {
    ring: "text-green-400",
    track: "text-green-900",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  Consider: {
    ring: "text-orange-400",
    track: "text-orange-900",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  Skip: {
    ring: "text-red-400",
    track: "text-red-900",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
  },
} as const;

function verdictFor(score: number): keyof typeof VERDICT_CONFIG {
  if (score >= 70) return "Apply";
  if (score >= 45) return "Consider";
  return "Skip";
}

function ScoreCircle({ score, verdict }: { score: number; verdict: keyof typeof VERDICT_CONFIG }) {
  const { ring, track } = VERDICT_CONFIG[verdict];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-28 w-28 flex-shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          className={track}
          stroke="currentColor"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={ring}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
        {score}
      </span>
    </div>
  );
}

export default function MatchCard({ match }: { match: MatchResult }) {
  const verdict = verdictFor(match.score);
  const { badge } = VERDICT_CONFIG[verdict];

  const strengths = match.strengths.slice(0, 3);
  const missing = match.missing_requirements.slice(0, 3);

  return (
    <div className="rounded-xl bg-gray-900 shadow-lg shadow-black/30 border border-gray-800 p-6 flex flex-col gap-5">
      {/* Header: score circle + title/company + badge */}
      <div className="flex items-start gap-5">
        <ScoreCircle score={match.score} verdict={verdict} />

        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-lg font-bold text-white truncate">{match.title}</h3>
          <p className="text-sm font-semibold text-gray-400 mt-0.5">{match.company}</p>
        </div>

        <span
          className={`self-start rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${badge}`}
        >
          {verdict}
        </span>
      </div>

      {/* Strengths + Missing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {strengths.length > 0 && (
          <ul className="space-y-1.5">
            {strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-gray-300">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        )}

        {missing.length > 0 && (
          <ul className="space-y-1.5">
            {missing.map((m) => (
              <li key={m} className="flex items-start gap-2 text-gray-300">
                <span className="text-red-400 mt-0.5">✗</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recommendation */}
      {match.recommendation && (
        <p className="text-sm italic text-gray-500">{match.recommendation}</p>
      )}

      {/* CTA */}
      <a
        href={match.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        Voir l&apos;offre
      </a>
    </div>
  );
}
