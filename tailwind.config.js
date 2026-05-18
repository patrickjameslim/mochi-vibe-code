/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mochi brand purple — overrides Tailwind's built-in violet scale
        violet: {
          50:  '#F4EFFE',
          100: '#E8DEFD',
          200: '#D1BCFA',
          300: '#B594F5',
          400: '#946BEF',
          500: '#7E50EB',
          600: '#6D41E8',
          700: '#5A32C9',
          800: '#4527A0',
          900: '#2E1B6E',
          950: '#1A0F40',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'bulk-bar-in': {
          from: { transform: 'translateY(120%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'sheet-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'sheet-out-right': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(100%)' },
        },
        'overlay-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'overlay-out': {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },
        'dialog-in': {
          from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
          to:   { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        'dialog-out': {
          from: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          to:   { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
        },
      },
      animation: {
        'bulk-bar-in': 'bulk-bar-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'sheet-in-right':  'sheet-in-right 0.3s cubic-bezier(0.16,1,0.3,1)',
        'sheet-out-right': 'sheet-out-right 0.25s ease-in',
        'overlay-in':  'overlay-in 0.25s ease',
        'overlay-out': 'overlay-out 0.2s ease',
        'dialog-in':  'dialog-in 0.2s cubic-bezier(0.16,1,0.3,1)',
        'dialog-out': 'dialog-out 0.15s ease-in',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
