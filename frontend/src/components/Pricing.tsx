const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "pour toujours",
    description: "Idéal pour découvrir la plateforme et tester l'analyse IA.",
    cta: "Commencer gratuitement",
    featured: false,
    features: [
      { text: "3 analyses par mois", included: true },
      { text: "10 offres par analyse", included: true },
      { text: "Score de compatibilité", included: true },
      { text: "Export PDF des résultats", included: false },
      { text: "Support prioritaire", included: false },
      { text: "Accès API", included: false },
    ],
  },
  {
    name: "Pro",
    price: "9.99",
    period: "/mois",
    description:
      "Pour les chercheurs d'emploi actifs qui veulent maximiser leurs chances.",
    cta: "Passer à Pro",
    featured: true,
    features: [
      { text: "Analyses illimitées", included: true },
      { text: "100 offres par analyse", included: true },
      { text: "Score de compatibilité", included: true },
      { text: "Export PDF des résultats", included: true },
      { text: "Traitement prioritaire", included: true },
      { text: "Accès API", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: "29.99",
    period: "/mois",
    description:
      "Pour les équipes RH et les cabinets de recrutement exigeants.",
    cta: "Contacter l'équipe",
    featured: false,
    features: [
      { text: "Tout le plan Pro inclus", included: true },
      { text: "Offres illimitées", included: true },
      { text: "Score de compatibilité", included: true },
      { text: "Export PDF des résultats", included: true },
      { text: "Support dédié 24/7", included: true },
      { text: "Accès API complet", included: true },
    ],
  },
] as const;

function CheckIcon({ muted }: { muted?: boolean }) {
  if (muted) {
    return (
      <svg
        className="h-4 w-4 shrink-0 text-slate-300 dark:text-surface-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18 18 6"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4 shrink-0 text-accent-500 dark:text-accent-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      {/* heading */}
      <div className="text-center mb-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-500 dark:text-accent-400">
          Tarifs
        </p>
        <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl text-balance">
          Un plan pour chaque besoin
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-slate-500 dark:text-surface-400">
          Commencez gratuitement, passez à Pro quand vous êtes prêt.
          Sans engagement, annulable à tout moment.
        </p>
      </div>

      {/* cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`
              relative flex flex-col rounded-2xl p-px transition-shadow duration-300
              ${
                plan.featured
                  ? "bg-gradient-to-b from-accent-400 via-accent-500 to-accent-600 shadow-glow md:scale-105 md:-my-3 z-10"
                  : ""
              }
            `}
          >
            {/* Populaire badge */}
            {plan.featured && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-500 px-4 py-1 text-xs font-bold text-white shadow-md z-20">
                Populaire
              </span>
            )}

            <div
              className={`
                flex flex-col flex-1 rounded-[calc(1rem-1px)] p-7
                ${
                  plan.featured
                    ? "bg-white dark:bg-surface-900"
                    : "bg-white border border-slate-200 dark:bg-surface-800/60 dark:border-surface-700/50"
                }
              `}
            >
              {/* plan name */}
              <p
                className={`text-sm font-semibold ${
                  plan.featured
                    ? "text-accent-600 dark:text-accent-400"
                    : "text-slate-500 dark:text-surface-400"
                }`}
              >
                {plan.name}
              </p>

              {/* price */}
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold text-slate-900 dark:text-white">
                  {plan.price}
                  <span className="text-xl">€</span>
                </span>
                <span className="text-sm text-slate-400 dark:text-surface-500">
                  {plan.period}
                </span>
              </div>

              {/* description */}
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-surface-400">
                {plan.description}
              </p>

              {/* cta */}
              <a
                href={plan.name === "Enterprise" ? "#contact" : "/register"}
                className={`
                  mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 active:scale-[0.97]
                  ${
                    plan.featured
                      ? "bg-accent-500 text-white shadow-sm hover:bg-accent-400 hover:shadow-glow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-surface-700 dark:text-surface-100 dark:hover:bg-surface-600"
                  }
                `}
              >
                {plan.cta}
              </a>

              {/* divider */}
              <div className="my-6 h-px bg-slate-200 dark:bg-surface-700/60" />

              {/* features */}
              <ul className="flex flex-col gap-3">
                {plan.features.map((f) => (
                  <li
                    key={f.text}
                    className={`flex items-center gap-3 text-sm ${
                      f.included
                        ? "text-slate-700 dark:text-surface-200"
                        : "text-slate-400 dark:text-surface-600 line-through decoration-slate-300/60 dark:decoration-surface-600/60"
                    }`}
                  >
                    <CheckIcon muted={!f.included} />
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
