import { Atkinson_Hyperlegible_Next, JetBrains_Mono, Young_Serif } from 'next/font/google';

// Self-hosted at build time: no request to Google at runtime and no layout shift on load.
// Atkinson Hyperlegible was designed for low-vision readers; it carries all body and UI text.
const body = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-body' });
// Young Serif sets page titles and orbit names, like the plates of a printed catalogue.
const display = Young_Serif({ subsets: ['latin'], weight: '400', variable: '--font-display' });
// Aligned numbers only: initial conditions and simulator readouts.
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const FONT_VARIABLES = [body.variable, display.variable, mono.variable].join(' ');
