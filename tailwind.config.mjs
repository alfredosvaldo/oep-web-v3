/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    // Escala de radios acotada: 0 / 4 / 6 / 8px. Sin rounded-xl/2xl de fábrica.
    borderRadius: {
      none: '0px',
      DEFAULT: '4px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      full: '9999px', // reservado para swatches/dots, no para botones ni cards
    },
    extend: {
      colors: {
        oep: {
          // Tinta = navy del logo; papel cálido de fondo.
          ink: '#1B2233',
          paper: '#F7F8F5',
          surface: '#FFFFFF',
          line: 'rgba(27,34,51,0.12)',
          lineLight: 'rgba(255,255,255,0.16)',
          'line-light': 'rgba(255,255,255,0.16)',
          // Superficie analítica oscura (≈20% del sitio): derivada del navy del
          // logo, más profunda para funcionar como fondo de datos, no de texto.
          slate: '#121A26',
          emerald: '#0E9F6E',
          emeraldLight: '#34D399',
          'emerald-light': '#34D399',
          copper: '#C2703D',
          copperDark: '#9A5830',
          // Alias kebab-case: `text-oep-copper-dark` se usa en varios componentes
          // (Tailwind no deriva kebab de una key camelCase automáticamente).
          'copper-dark': '#9A5830',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          500: '#64748B',
          700: '#334155',
        },
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plexmono)', 'monospace'],
      },
      maxWidth: {
        content: '1320px',
        prose: '760px',
      },
      transitionDuration: {
        nav: '180ms',
      },
    },
  },
  plugins: [],
};

export default config;
