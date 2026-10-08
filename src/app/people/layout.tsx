import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The people view is a private tool, not a marketing page. Keep it out of search.
export const metadata: Metadata = {
  title: 'People | Holdfast',
  robots: { index: false, follow: false },
};

export default function PeopleLayout({ children }: { children: ReactNode }) {
  return children;
}
