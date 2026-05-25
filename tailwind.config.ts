import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#050608",
          900: "#090D12",
          850: "#0D1118",
          800: "#111827",
          line: "rgba(255,255,255,0.12)",
          purple: "#8B5CF6",
          green: "#22C55E"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(139, 92, 246, 0.26)",
        greenGlow: "0 0 34px rgba(34, 197, 94, 0.22)"
      },
      animation: {
        floaty: "floaty 8s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      }
    }
  },
  plugins: []
};

export default config;
