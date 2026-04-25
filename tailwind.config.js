/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
          DEFAULT: '#05070c',
          elevated: '#0b0f18',
          panel: '#0f1420',
          input: '#0a0e17',
          line: '#1a2234',
        },
        cyber: {
          cyan: '#3bf5ff',
          'cyan-dim': '#1cc5d0',
          magenta: '#ff3ad6',
          'magenta-dim': '#c72aa9',
          violet: '#8b5cf6',
          lime: '#b6ff4d',
          amber: '#ffb547',
          red: '#ff3b5c',
          grid: '#1e2535',
        },
        text: {
          primary: '#e6eefc',
          secondary: '#8a96b0',
          muted: '#5a6480',
          faded: '#3e465c',
        },
        status: {
          committed: '#3bf5ff',
          copied: '#ff3ad6',
          terminated: '#ff3b5c',
          pending: '#ffb547',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 12px rgba(59, 245, 255, 0.45), 0 0 32px rgba(59, 245, 255, 0.12)',
        'glow-cyan-strong': '0 0 20px rgba(59, 245, 255, 0.7), 0 0 48px rgba(59, 245, 255, 0.25)',
        'glow-magenta': '0 0 12px rgba(255, 58, 214, 0.45), 0 0 32px rgba(255, 58, 214, 0.12)',
        'glow-red': '0 0 10px rgba(255, 59, 92, 0.5)',
        'panel': '0 0 0 1px rgba(59, 245, 255, 0.08), 0 8px 28px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'grid-dots':
          'radial-gradient(circle, rgba(59, 245, 255, 0.12) 1px, transparent 1px)',
        'grid-dots-strong':
          'radial-gradient(circle, rgba(59, 245, 255, 0.22) 1px, transparent 1px)',
        'scanline':
          'linear-gradient(180deg, transparent 0%, transparent 50%, rgba(59, 245, 255, 0.03) 50%, rgba(59, 245, 255, 0.03) 51%, transparent 51%)',
      },
      backgroundSize: {
        'dots-sm': '16px 16px',
        'dots-md': '24px 24px',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 12px rgba(59, 245, 255, 0.45), 0 0 32px rgba(59, 245, 255, 0.12)',
          },
          '50%': {
            boxShadow: '0 0 22px rgba(59, 245, 255, 0.7), 0 0 52px rgba(59, 245, 255, 0.28)',
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
