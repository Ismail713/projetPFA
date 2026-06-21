import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import CVUpload from "@/components/cv/CVUpload";
import MatchesList from "@/components/jobs/MatchesList";

export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <Pricing />

      {/* Upload */}
      <section id="upload" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Déposez votre CV
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-surface-400">
            Notre IA commence l&apos;analyse dès la réception du fichier.
          </p>
        </div>
        <CVUpload />
      </section>

      {/* Matches */}
      <section id="matches" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-surface-600/60 to-transparent" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-surface-400">
            Résultats
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-surface-600/60 to-transparent" />
        </div>

        <MatchesList />
      </section>
    </>
  );
}
