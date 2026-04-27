/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
        display: ['Orbitron', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
          panel: 'rgb(var(--bg-panel) / <alpha-value>)',
          input: 'rgb(var(--bg-input) / <alpha-value>)',
          line: 'rgb(var(--bg-line) / <alpha-value>)',
        },
        cyber: {
          cyan: 'rgb(var(--cyber-cyan) / <alpha-value>)',
          'cyan-dim': 'rgb(var(--cyber-cyan-dim) / <alpha-value>)',
          magenta: 'rgb(var(--cyber-magenta) / <alpha-value>)',
          'magenta-dim': 'rgb(var(--cyber-magenta-dim) / <alpha-value>)',
          violet: 'rgb(var(--cyber-violet) / <alpha-value>)',
          lime: 'rgb(var(--cyber-lime) / <alpha-value>)',
          amber: 'rgb(var(--cyber-amber) / <alpha-value>)',
          red: 'rgb(var(--cyber-red) / <alpha-value>)',
          grid: 'rgb(var(--cyber-grid) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          faded: 'rgb(var(--text-faded) / <alpha-value>)',
        },
        status: {
          committed: 'rgb(var(--cyber-cyan) / <alpha-value>)',
          copied: 'rgb(var(--cyber-magenta) / <alpha-value>)',
          terminated: 'rgb(var(--cyber-red) / <alpha-value>)',
          pending: 'rgb(var(--cyber-amber) / <alpha-value>)',
        },
      },
      boxShadow: {
        'glow-cyan':
          '0 0 12px rgb(var(--cyber-cyan) / 0.45), 0 0 32px rgb(var(--cyber-cyan) / 0.12)',
        'glow-cyan-strong':
          '0 0 20px rgb(var(--cyber-cyan) / 0.7), 0 0 48px rgb(var(--cyber-cyan) / 0.25)',
        'glow-magenta':
          '0 0 12px rgb(var(--cyber-magenta) / 0.45), 0 0 32px rgb(var(--cyber-magenta) / 0.12)',
        'glow-red': '0 0 10px rgb(var(--cyber-red) / 0.5)',
        'panel':
          '0 0 0 1px rgb(var(--cyber-cyan) / 0.08), 0 8px 28px rgb(var(--shadow-rgb) / 0.5)',
      },
      backgroundImage: {
        'grid-dots':
          'radial-gradient(circle, rgb(var(--cyber-cyan) / 0.12) 1px, transparent 1px)',
        'grid-dots-strong':
          'radial-gradient(circle, rgb(var(--cyber-cyan) / 0.22) 1px, transparent 1px)',
        'scanline':
          'linear-gradient(180deg, transparent 0%, transparent 50%, rgb(var(--cyber-cyan) / 0.03) 50%, rgb(var(--cyber-cyan) / 0.03) 51%, transparent 51%)',
      },
      backgroundSize: {
        'dots-sm': '16px 16px',
        'dots-md': '24px 24px',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow:
              '0 0 12px rgb(var(--cyber-cyan) / 0.45), 0 0 32px rgb(var(--cyber-cyan) / 0.12)',
          },
          '50%': {
            boxShadow:
              '0 0 22px rgb(var(--cyber-cyan) / 0.7), 0 0 52px rgb(var(--cyber-cyan) / 0.28)',
          },
        },
        'blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(260%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ambient-drift': {
          '0%': { backgroundPosition: '0% 0%, 100% 100%, 0 0' },
          '100%': { backgroundPosition: '8% 4%, 92% 96%, 0 0' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'scan': 'scan 4s linear infinite',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
