import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartMatch CV — Trouvez l'emploi qui vous correspond",
  description:
    "Déposez votre CV et laissez l'IA trouver les offres qui correspondent vraiment à votre profil.",
};

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-surface-700/50 mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 dark:text-surface-500">
          &copy; {new Date().getFullYear()} SmartMatch. Propulsé par
          l&apos;intelligence artificielle.
        </p>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-match-apply animate-pulse-slow" />
          <span className="text-xs text-slate-400 dark:text-surface-500">
            Système opérationnel
          </span>
        </div>
      </div>
    </footer>
  );
}

const THEME_SCRIPT = `
(function(){
  var t = localStorage.getItem('smartmatch-theme');
  if (t === 'light') document.documentElement.classList.remove('dark');
  else if (t === 'dark') document.documentElement.classList.add('dark');
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
