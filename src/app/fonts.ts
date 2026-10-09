import { Fraunces, Inter } from 'next/font/google';

// Scoped to the landing and legal routes — static weight instances (not the
// `variable` axis) because Fraunces' full variable range is large and the
// page only ever uses 400/500/600.
export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-inter',
  display: 'swap',
});
