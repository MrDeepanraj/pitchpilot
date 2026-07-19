import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090B",
        surface: "#0E0E11",
        card: "#131317",
        cardhi: "#1A1A20",
        line: "#242430",
        muted: "#9A9AA7",
        subtle: "#63636E",
        fg: "#ECECEF",
        brand: { DEFAULT: "#22C55E", 600: "#16A34A", soft: "#4ADE80" },
        accent: "#22D3EE",
        ok: "#34D399",
        warn: "#FBBF24",
        danger: "#F87171",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.35)",
        pop: "0 20px 60px rgba(0,0,0,0.55)",
        glow: "0 6px 30px rgba(34,197,94,0.28)",
      },
      keyframes: {
        in: { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { in: "in 0.22s ease-out" },
    },
  },
  plugins: [],
};

export default config;
