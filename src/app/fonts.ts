import { Atkinson_Hyperlegible_Next, JetBrains_Mono, Manrope } from 'next/font/google';

// Self-hosted at build time: no request to Google at runtime and no layout shift on load.
// Atkinson Hyperlegible was designed for low-vision readers; it carries all body and UI text.
// Next ships no fallback metrics for this family: an explicit fallback stack skips the
// metric lookup (and its build warning) under both Turbopack and webpack.
const body = Atkinson_Hyperlegible_Next({
  subsets: ['latin'],
  variable: '--font-body',
  fallback: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
  adjustFontFallback: false,
});
// Manrope sets titles and orbit names: rounded and heavy, like the liquid glass around it.
const display = Manrope({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-display' });
// Aligned numbers only: initial conditions and simulator readouts.
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const FONT_VARIABLES = [body.variable, display.variable, mono.variable].join(' ');
