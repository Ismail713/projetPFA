"use client";

const JOBS_LEFT = [
  { title: "Développeur Full Stack", company: "TechCorp", location: "Paris", score: 92 },
  { title: "Designer UX/UI", company: "DesignLab", location: "Lyon", score: 78 },
  { title: "Data Scientist", company: "DataFlow", location: "Marseille", score: 95 },
  { title: "Chef de Projet IT", company: "Innova", location: "Toulouse", score: 64 },
  { title: "Ingénieur DevOps", company: "CloudSys", location: "Bordeaux", score: 83 },
  { title: "Analyste Cybersécurité", company: "SecureNet", location: "Lille", score: 71 },
];

const JOBS_RIGHT = [
  { title: "Product Manager", company: "StartupX", location: "Nantes", score: 88 },
  { title: "Architecte Cloud", company: "SkyOps", location: "Paris", score: 76 },
  { title: "Développeur Mobile", company: "AppWorks", location: "Montpellier", score: 91 },
  { title: "Lead Frontend", company: "PixelPerfect", location: "Remote", score: 85 },
  { title: "Ingénieur ML", company: "DeepAI", location: "Grenoble", score: 69 },
  { title: "Scrum Master", company: "AgileCo", location: "Strasbourg", score: 73 },
];

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400 bg-emerald-500/15";
  if (score >= 65) return "text-amber-400 bg-amber-500/15";
  return "text-red-400 bg-red-500/15";
}

function FloatingCard({
  title,
  company,
  location,
  score,
}: {
  title: string;
  company: string;
  location: string;
  score: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm px-4 py-3.5 w-56 shrink-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/80 truncate">
            {title}
          </p>
          <p className="mt-0.5 text-xs text-white/40">{company}</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${scoreColor(score)}`}
        >
          {score}%
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <svg
          className="h-3 w-3 text-white/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
        <span className="text-[11px] text-white/30">{location}</span>
      </div>
    </div>
  );
}

function ScrollColumn({
  jobs,
  direction,
}: {
  jobs: typeof JOBS_LEFT;
  direction: "up" | "down";
}) {
  const doubled = [...jobs, ...jobs];
  return (
    <div className="h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
      <div
        className={`flex flex-col gap-4 ${
          direction === "up" ? "animate-scroll-up" : "animate-scroll-down"
        }`}
      >
        {doubled.map((job, i) => (
          <FloatingCard key={`${job.title}-${i}`} {...job} />
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-surface-950 min-h-[600px] sm:min-h-[640px]">
      {/* ── Gradient background ────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent-900/30 via-surface-950 to-surface-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-accent-600/15 blur-[140px]" />
        <div className="absolute -bottom-20 -right-20 h-[300px] w-[400px] rounded-full bg-accent-500/8 blur-[100px]" />
      </div>

      {/* ── Floating cards (desktop only) ──────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:flex items-start justify-between px-8 xl:px-16 pt-24 opacity-50"
      >
        <ScrollColumn jobs={JOBS_LEFT} direction="up" />
        <ScrollColumn jobs={JOBS_RIGHT} direction="down" />
      </div>

      {/* ── Content ────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-32 sm:pt-36 text-center flex flex-col items-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-500/10 px-4 py-1.5 text-xs font-medium text-accent-300 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
          </span>
          Propulsé par l&apos;intelligence artificielle
        </p>

        <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl text-balance animate-fade-in">
          Trouvez l&apos;emploi parfait{" "}
          <span className="bg-gradient-to-r from-accent-400 to-accent-200 bg-clip-text text-transparent">
            grâce à l&apos;IA
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface-300 sm:text-lg animate-fade-in">
          Uploadez votre CV et notre IA analyse des centaines d&apos;offres pour
          trouver les meilleures correspondances.
        </p>

        <a
          href="#upload"
          className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all duration-200 hover:bg-accent-400 hover:shadow-accent-400/30 hover:shadow-xl active:scale-[0.97] animate-slide-up"
        >
          Analyser mon CV gratuitement
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
            />
          </svg>
        </a>

        {/* ── Trust bar ────────────────────────── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-accent-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            <span className="text-sm text-surface-400">
              <span className="font-semibold text-white">10 000+</span> CV
              analysés
            </span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-surface-600" />
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-emerald-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-surface-400">
              <span className="font-semibold text-white">95%</span> de
              satisfaction
            </span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-surface-600" />
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-surface-400">
              <span className="font-semibold text-white">500+</span>{" "}
              entreprises
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom fade to page bg ─────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-50 dark:from-surface-950 to-transparent"
      />
    </section>
  );
}
