import type { Metadata } from 'next';
import { fraunces, inter } from './fonts';
import styles from './waitlist.module.css';
import { WaitlistForm } from '@/components/waitlist-form';
import { ScrollReveal } from '@/components/scroll-reveal';

const TITLE = 'Holdfast: Never lose touch with the people who matter';
const DESCRIPTION =
  "Talk for twenty seconds after seeing a friend. Holdfast remembers what matters and reminds you at the moment it counts.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
  },
};

interface HomeProps {
  searchParams: Promise<{ ref?: string | string[] }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const rawRef = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  const source = rawRef?.trim() || undefined;

  return (
    <div className={`${styles.page} ${fraunces.variable} ${inter.variable}`}>
      <header className={styles.header}>
        <div className={styles.wrap}>
          <div className={styles.logo}>
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path
                d="M4 4h20a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H10l-4 5 .4-5H4a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
                transform="translate(0,1)"
                fill="#B4552D"
              />
              <g stroke="#FBF7F2" strokeWidth="1.9" strokeLinecap="round">
                <path d="M6.5 13v0.2M10 11v4.4M13.5 8.6v9.2M17 10.4v5.6M20.5 12.4v1.6" />
              </g>
            </svg>
            Holdfast
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.wrap}>
            <h1 className={styles.heroH1}>Never lose touch with the people who matter.</h1>
            <p className={styles.lede}>
              Talk for twenty seconds after you see a friend. Holdfast remembers what&apos;s
              going on in their life and what you promised. Then it reminds you{' '}
              <strong>at the moment it actually matters.</strong>
            </p>
            <p className={styles.pronounce}>
              <em>holdfast</em> <span>·</span> the root that anchors seaweed to rock, so the
              current <strong>can&apos;t take it</strong>
            </p>

            <WaitlistForm source={source} visibleLabel />
            <p className={styles.microcopy}>Early access, no spam, unsubscribe anytime.</p>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.wrap}>
            <h2 className={styles.reveal} data-reveal>
              Most friendships don&apos;t end. They just go quiet.
            </h2>
            <div className={styles.grid}>
              <div className={`${styles.stat} ${styles.reveal}`} data-reveal>
                <div className={styles.num}>12%</div>
                <p>of Americans said they had no close friends in 2021, up from just 3% in 1990.</p>
              </div>
              <div className={`${styles.stat} ${styles.reveal}`} data-reveal>
                <div className={styles.num}>27%</div>
                <p>of men had six or more close friends, down from 55% three decades earlier.</p>
              </div>
              <div className={`${styles.stat} ${styles.reveal}`} data-reveal>
                <div className={styles.num}>200</div>
                <p>hours of shared time, roughly, before someone becomes a close friend.</p>
              </div>
            </div>
            <p className={styles.attrib}>
              Sources: Survey Center on American Life, <em>The State of American Friendship</em>{' '}
              (survey conducted May 2021); Hall, <em>Journal of Social and Personal Relationships</em>{' '}
              (2019).
            </p>
          </div>
        </section>

        <section className={styles.how}>
          <div className={styles.wrap}>
            <h2 className={styles.reveal} data-reveal>
              Twenty seconds of talking. That&apos;s the whole habit.
            </h2>
            <ol className={styles.steps}>
              <li className={styles.reveal} data-reveal>
                <div>
                  <h3>Say what happened</h3>
                  <p>
                    &quot;Coffee with Marco. His mom&apos;s surgery is on the 14th. He&apos;s
                    stressed about the job hunt. I said I&apos;d send him a recruiter
                    contact.&quot; Hold the button, talk, done.
                  </p>
                </div>
              </li>
              <li className={styles.reveal} data-reveal>
                <div>
                  <h3>Holdfast sorts it out</h3>
                  <p>
                    It pulls out who you saw, what&apos;s happening in their life, the dates
                    that matter, and, most importantly, anything you said you&apos;d do.
                  </p>
                </div>
              </li>
              <li className={styles.reveal} data-reveal>
                <div>
                  <h3>It finds you at the right moment</h3>
                  <p>
                    On the 15th: <em>Marco&apos;s mom had surgery yesterday. Ask how it
                    went.</em> Three days later: <em>You still haven&apos;t sent that
                    contact.</em> Never more than a few nudges a week.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className={styles.why}>
          <div className={styles.wrap}>
            <h2 className={styles.reveal} data-reveal>
              No app can import the people you love.
            </h2>
            <p className={styles.reveal} data-reveal>
              Facebook will only tell you which friends already use this app. Instagram closed
              its doors to third-party consumer apps at the end of 2024. Snapchat never opened a
              social graph at all.
            </p>
            <p className={styles.reveal} data-reveal>
              So none of this gets scraped from anywhere.{' '}
              <strong>It only exists because you said it out loud.</strong>
            </p>
            <p className={styles.reveal} data-reveal>
              Which, honestly, is the right way round. Nobody needs a list of 800
              acquaintances. You need the fifteen people you&apos;d be gutted to drift away
              from. Only you know who they are.
            </p>
          </div>
        </section>

        <section className={styles.cta}>
          <div className={styles.wrap}>
            <h2>Be a better friend without trying to remember everything.</h2>
            <p className={styles.ctaLede}>
              Holdfast is in early development. Join the waitlist and you&apos;ll be among the
              first in.
            </p>
            <WaitlistForm source={source} visibleLabel={false} />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <p>
            <strong>Holdfast:</strong> remember what matters to the people you love.
          </p>
          <p>
            &copy; 2026 Holdfast. <a href="mailto:holdfastapp@gmail.com">holdfastapp@gmail.com</a>
          </p>
        </div>
      </footer>

      <ScrollReveal />
    </div>
  );
}
