"use client";

function UploadIcon() {
  return (
    <svg
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

function AiIcon() {
  return (
    <svg
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

function MatchIcon() {
  return (
    <svg
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <div className="hidden md:flex items-center justify-center text-slate-300 dark:text-surface-600 shrink-0 pt-2">
      <svg className="h-8 w-12" fill="none" viewBox="0 0 48 32">
        <path
          d="M4 16h34"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 4"
        />
        <path
          d="M34 10l6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Uploadez votre CV",
    description:
      "Déposez votre CV au format PDF. L'extraction est instantanée : compétences, expériences et formations sont identifiées automatiquement.",
    Icon: UploadIcon,
    animation: "animate-float",
    accent: "from-accent-500 to-accent-400",
    accentLight: "bg-accent-50 dark:bg-accent-500/10",
    accentText: "text-accent-600 dark:text-accent-400",
    accentRing: "ring-accent-200 dark:ring-accent-500/20",
  },
  {
    number: "02",
    title: "L'IA analyse",
    description:
      "Notre moteur d'intelligence artificielle compare votre profil à des centaines d'offres en temps réel pour évaluer chaque correspondance.",
    Icon: AiIcon,
    animation: "animate-float-delayed",
    accent: "from-violet-500 to-purple-400",
    accentLight: "bg-violet-50 dark:bg-violet-500/10",
    accentText: "text-violet-600 dark:text-violet-400",
    accentRing: "ring-violet-200 dark:ring-violet-500/20",
  },
  {
    number: "03",
    title: "Recevez vos matches",
    description:
      "Consultez un classement personnalisé avec un score de compatibilité, les points forts et les éventuels écarts pour chaque offre.",
    Icon: MatchIcon,
    animation: "animate-float-slow",
    accent: "from-emerald-500 to-teal-400",
    accentLight: "bg-emerald-50 dark:bg-emerald-500/10",
    accentText: "text-emerald-600 dark:text-emerald-400",
    accentRing: "ring-emerald-200 dark:ring-emerald-500/20",
  },
] as const;

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative border-y border-slate-200/70 dark:border-surface-700/40 bg-slate-100/50 dark:bg-surface-900/50"
    >
      {/* subtle texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.04)_1px,_transparent_0)] [background-size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.06)_1px,_transparent_0)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {/* heading */}
        <div className="text-center mb-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-500 dark:text-accent-400">
            Simple &amp; rapide
          </p>
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl text-balance">
            Comment ça marche
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-500 dark:text-surface-400">
            Trois étapes suffisent pour passer de votre CV à une liste d&apos;offres triées par pertinence.
          </p>
        </div>

        {/* steps */}
        <div className="flex flex-col md:flex-row items-start justify-center gap-6 md:gap-0">
          {STEPS.map((step, i) => (
            <div key={step.number} className="contents">
              {/* card */}
              <div className="group flex-1 max-w-sm w-full md:w-auto flex flex-col items-center text-center px-4">
                {/* icon bubble */}
                <div
                  className={`
                    relative mb-6 flex h-20 w-20 items-center justify-center
                    rounded-2xl ring-1 ${step.accentRing} ${step.accentLight}
                    transition-shadow duration-300 group-hover:shadow-glow-sm
                  `}
                >
                  <div className={`${step.accentText} ${step.animation}`}>
                    <step.Icon />
                  </div>

                  {/* step number */}
                  <span
                    className={`
                      absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center
                      rounded-full bg-gradient-to-br ${step.accent}
                      text-[11px] font-bold text-white shadow-sm
                    `}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-surface-400 max-w-xs">
                  {step.description}
                </p>
              </div>

              {/* arrow between cards */}
              {i < STEPS.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
