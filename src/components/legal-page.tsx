import Link from 'next/link';
import type { ReactNode } from 'react';
import { fraunces, inter } from '@/app/fonts';
import styles from '@/app/waitlist.module.css';
import legal from '@/app/legal.module.css';
import { HoldfastLogo } from '@/components/holdfast-logo';

interface LegalPageProps {
  title: string;
  // Shown as "Last updated ..."; change it whenever the text changes.
  updated: string;
  children: ReactNode;
}

// Shared frame for /privacy and /terms: the landing page header and footer
// around a single readable column.
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className={`${styles.page} ${fraunces.variable} ${inter.variable}`}>
      <header className={styles.header}>
        <div className={styles.wrap}>
          <Link href="/" className={`${styles.logo} ${legal.homeLink}`}>
            <HoldfastLogo />
          </Link>
        </div>
      </header>

      <main className={styles.wrap}>
        <article className={legal.doc}>
          <h1>{title}</h1>
          <p className={legal.updated}>Last updated {updated}</p>
          {children}
        </article>
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <p>
            &copy; 2026 Holdfast. <a href="mailto:hello@useholdfast.co">hello@useholdfast.co</a>
          </p>
          <p>
            <Link href="/">Home</Link> · <Link href="/privacy">Privacy</Link> ·{' '}
            <Link href="/terms">Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
