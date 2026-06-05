/** @type {import('tailwindcss').Config} */
const ink = (v) => `rgb(var(--ink-${v}) / <alpha-value>)`
export default {
  darkMode: 'class',
  content: ['./src/options/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Institutional monochrome ramp, driven by CSS variables so the whole
        // scale flips between dark and light themes (see index.css). Low
        // numbers are surfaces, high numbers are text — this holds in both
        // modes because the light theme mirrors the ramp.
        ink: {
          950: ink(950),
          900: ink(900),
          850: ink(850),
          800: ink(800),
          700: ink(700),
          600: ink(600),
          500: ink(500),
          400: ink(400),
          300: ink(300),
          200: ink(200),
          100: ink(100),
          50: ink(50),
        },
        // The single vibrant neon accent — dimmed in light mode for legibility.
        neon: {
          DEFAULT: 'rgb(var(--neon) / <alpha-value>)',
          dim: '#9bcc00',
          glow: 'rgba(198, 255, 0, 0.35)',
        },
      },
      fontFamily: {
        mono: ['"SF Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(198,255,0,0.5), 0 0 24px -4px rgba(198,255,0,0.45)',
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.8)',
      },
      letterSpacing: {
        institutional: '0.18em',
      },
    },
  },
  plugins: [],
}
