/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/options/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Institutional monochrome ramp — pitch black to bone white.
        ink: {
          950: '#050505',
          900: '#0a0a0b',
          850: '#101012',
          800: '#161618',
          700: '#202023',
          600: '#2c2c30',
          500: '#3a3a40',
          400: '#52525a',
          300: '#71717a',
          200: '#a1a1aa',
          100: '#d4d4d8',
          50: '#f4f4f5',
        },
        // The single vibrant neon accent — used sparingly for chaos/peaks.
        neon: {
          DEFAULT: '#c6ff00',
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
