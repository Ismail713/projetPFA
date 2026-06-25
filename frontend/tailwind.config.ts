import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0B1120",
          50: "#F0F4FF",
          100: "#DDE4F0",
          200: "#B4C0D8",
          300: "#8494B2",
          400: "#5A6A88",
          500: "#3D4E6B",
          600: "#283A56",
          700: "#1B2B44",
          800: "#121E34",
          900: "#0B1120",
          950: "#060A14",
        },
        accent: {
          DEFAULT: "#6366F1",
          50: "#EDEFFF",
          100: "#DEE0FF",
          200: "#C3C6FC",
          300: "#A5A8F8",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        match: {
          apply: "#34D399",
          "apply-muted": "#064E3B",
          consider: "#FBBF24",
          "consider-muted": "#78350F",
          skip: "#F87171",
          "skip-muted": "#7F1D1D",
        },
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(99, 102, 241, 0.3)",
        "glow-sm": "0 0 12px -2px rgba(99, 102, 241, 0.2)",
        card: "0 4px 32px -8px rgba(0, 0, 0, 0.5)",
        "card-hover": "0 8px 40px -8px rgba(0, 0, 0, 0.6)",
        "card-light": "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-light-hover": "0 4px 12px -2px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "score-fill": "scoreFill 0.8s ease-out forwards",
        "scroll-up": "scrollUp 35s linear infinite",
        "scroll-down": "scrollDown 40s linear infinite",
        float: "float 4s ease-in-out infinite",
        "float-delayed": "float 4s ease-in-out 1.3s infinite",
        "float-slow": "float 5s ease-in-out 0.6s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scoreFill: {
          "0%": { strokeDashoffset: "var(--circumference)" },
          "100%": { strokeDashoffset: "var(--offset)" },
        },
        scrollUp: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
        scrollDown: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
