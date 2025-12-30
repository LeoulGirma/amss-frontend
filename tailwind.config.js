/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // AMSS Aviation Status Colors
        operational: {
          DEFAULT: "hsl(var(--operational))",
          light: "hsl(var(--operational-light))",
          dark: "hsl(var(--operational-dark))",
        },
        maintenance: {
          DEFAULT: "hsl(var(--maintenance))",
          light: "hsl(var(--maintenance-light))",
          dark: "hsl(var(--maintenance-dark))",
        },
        grounded: {
          DEFAULT: "hsl(var(--grounded))",
          light: "hsl(var(--grounded-light))",
          dark: "hsl(var(--grounded-dark))",
        },
        // Task Status Colors
        scheduled: {
          DEFAULT: "hsl(var(--scheduled))",
          light: "hsl(var(--scheduled-light))",
          dark: "hsl(var(--scheduled-dark))",
        },
        "in-progress": {
          DEFAULT: "hsl(var(--in-progress))",
          light: "hsl(var(--in-progress-light))",
          dark: "hsl(var(--in-progress-dark))",
        },
        completed: {
          DEFAULT: "hsl(var(--completed))",
          light: "hsl(var(--completed-light))",
          dark: "hsl(var(--completed-dark))",
        },
        cancelled: {
          DEFAULT: "hsl(var(--cancelled))",
          light: "hsl(var(--cancelled-light))",
          dark: "hsl(var(--cancelled-dark))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-status": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-status": "pulse-status 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
