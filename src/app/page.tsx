import type { Metadata } from 'next';
import { fraunces, inter } from './fonts';
import styles from './waitlist.module.css';
import { WaitlistForm } from '@/components/waitlist-form';
import { ScrollReveal } from '@/components/scroll-reveal';
import { AudioLines, FileText, MessageCircle, Play, ShieldCheck, Trash2 } from 'lucide-react';

// Bar heights (px) for the decorative voice-note waveform in the hero demo.
const WAVE = [6, 10, 16, 12, 20, 14, 8, 18, 22, 12, 16, 9, 14, 19, 11, 7, 13, 17, 10, 6];

const TITLE = 'Remember things about friends in 20 seconds | Holdfast';
const DESCRIPTION =
  "Talk for 20 seconds after you see a friend. Holdfast remembers what's going on in their life and what you promised, then reminds you when it matters.";

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
          <div className={`${styles.wrap} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                <AudioLines size={16} aria-hidden="true" />
                Voice notes in Telegram. No new app.
              </p>
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

            {/* Replies mirror the bot's real wording: formatExtractionSummary()
                in lib/extract.ts and the commitment nudge in lib/nudges.ts. */}
            <figure className={styles.demo}>
              <figcaption className={styles.srOnly}>
                Example conversation with the Holdfast bot in Telegram
              </figcaption>
              <div className={styles.demoHead} aria-hidden="true">
                <span className={styles.demoAvatar}>
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                    <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                      <path d="M6.5 13v0.2M10 11v4.4M13.5 8.6v9.2M17 10.4v5.6M20.5 12.4v1.6" />
                    </g>
                  </svg>
                </span>
                <span className={styles.demoName}>
                  Holdfast <span>bot</span>
                </span>
              </div>
              <ol className={styles.thread}>
                <li className={`${styles.bubble} ${styles.bubbleMe}`}>
                  <span className={styles.srOnly}>You send a voice note, 18 seconds long.</span>
                  <span className={styles.voice} aria-hidden="true">
                    <span className={styles.play}>
                      <Play size={13} fill="currentColor" strokeWidth={0} />
                    </span>
                    <span className={styles.wave}>
                      {WAVE.map((h, i) => (
                        <i key={i} style={{ height: `${h}px` }} />
                      ))}
                    </span>
                    <span className={styles.voiceTime}>0:18</span>
                  </span>
                </li>
                <li className={`${styles.bubble} ${styles.bubbleBot}`}>
                  <p>Marco: mom&apos;s surgery on the 14th, stressed about the job hunt.</p>
                  <p>Marco: you said you&apos;d introduce him to a recruiter.</p>
                </li>
                <li className={styles.threadDivider}>
                  <span>3 days later</span>
                </li>
                <li className={`${styles.bubble} ${styles.bubbleBot}`}>
                  <p>Marco: you said you&apos;d introduce him to a recruiter. Still worth doing?</p>
                </li>
              </ol>
            </figure>
          </div>

          {/* Click to play: browsers block autoplay with sound. Source lives in
              ../holdfast-video (Remotion); see its README to rebuild. */}
          <div className={`${styles.wrap} ${styles.heroVideo}`}>
            <video
              className={styles.video}
              controls
              playsInline
              preload="none"
              poster="/video/holdfast-explainer-poster.jpg"
              aria-label="How Holdfast works, a 72 second video with narration"
            >
              <source src="/video/holdfast-explainer.mp4" type="video/mp4" />
              <track kind="captions" src="/video/holdfast-explainer.vtt" srcLang="en" label="English" />
            </video>
            <p className={styles.videoCaption}>Watch how it works. 72 seconds, sound on, captions available.</p>
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
            <p className={`${styles.howLede} ${styles.reveal}`} data-reveal>
              No typing, no forms, no fields to fill in. You talk, Holdfast does the sorting.
            </p>
            <ol className={styles.steps}>
              <li className={styles.reveal} data-reveal>
                <div>
                  <h3>Say what happened</h3>
                  <p>
                    &quot;Coffee with Marco. His mom&apos;s surgery is on the 14th. He&apos;s
                    stressed about the job hunt. I said I&apos;d introduce him to a
                    recruiter.&quot; Hold the button, talk, done.
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
                    went.</em> Three days later: <em>You still haven&apos;t introduced Marco
                    to that recruiter.</em> At most three nudges a week. Enough to help, never enough
                    to nag.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className={styles.adhd}>
          <div className={styles.wrap}>
            <h2 className={styles.reveal} data-reveal>
              Forgetting isn&apos;t the same as not caring.
            </h2>
            <p className={styles.reveal} data-reveal>
              If you have ADHD, this might sound familiar. Out of sight, out of mind, even with
              people you love. It says nothing about how much they matter to you.
            </p>
            <p className={styles.reveal} data-reveal>
              Most friend apps ask you to remember to open them, find the person, and type it all
              up. That&apos;s one more thing to forget.
            </p>
            <p className={styles.reveal} data-reveal>
              <strong>
                Holdfast asks for twenty seconds in a chat you already use. After that, the
                remembering is its job, not yours.
              </strong>
            </p>
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

        <section className={styles.privacy} id="privacy">
          <div className={styles.wrap}>
            <h2 className={styles.reveal} data-reveal>
              Where your voice note goes.
            </h2>
            <p className={`${styles.privacyLede} ${styles.reveal}`} data-reveal>
              Here is what happens today, in plain words.
            </p>
            <ul className={styles.privacyList}>
              <li className={styles.reveal} data-reveal>
                <span className={styles.privacyIcon} aria-hidden="true">
                  <FileText size={20} />
                </span>
                <h3>It gets turned into text.</h3>
                <p>
                  We send your recording to OpenAI to transcribe it. OpenAI then reads the text
                  to pick out the people, dates and promises.
                </p>
              </li>
              <li className={styles.reveal} data-reveal>
                <span className={styles.privacyIcon} aria-hidden="true">
                  <Trash2 size={20} />
                </span>
                <h3>The recording gets deleted.</h3>
                <p>
                  As soon as the text is saved, we delete the audio from our storage. We keep
                  words, never recordings.
                </p>
              </li>
              <li className={styles.reveal} data-reveal>
                <span className={styles.privacyIcon} aria-hidden="true">
                  <MessageCircle size={20} />
                </span>
                <h3>Your copy stays with you.</h3>
                <p>
                  The original voice note stays in your Telegram chat. Delete it there whenever
                  you like.
                </p>
              </li>
              <li className={styles.reveal} data-reveal>
                <span className={styles.privacyIcon} aria-hidden="true">
                  <ShieldCheck size={20} />
                </span>
                <h3>It isn&apos;t used for training.</h3>
                <p>
                  OpenAI says it doesn&apos;t train its models on data sent through its API by
                  default. It may keep the text for up to 30 days for abuse checks.{' '}
                  <a
                    href="https://developers.openai.com/api/docs/guides/your-data"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read OpenAI&apos;s data policy
                  </a>
                  .
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* Answers must match what the product does today: the drift nudge
            and the 3-per-week cap live in lib/nudges.ts. */}
        <section className={styles.faq}>
          <div className={styles.wrap}>
            <h2 className={styles.reveal} data-reveal>
              Questions people ask.
            </h2>
            <ul className={styles.faqList}>
              <li className={styles.reveal} data-reveal>
                <h3>Do I need to download a new app?</h3>
                <p>
                  Not if you use Telegram. Holdfast lives there as a chat: hold the record button,
                  talk, and let go. If you don&apos;t have Telegram yet, it&apos;s free on iPhone,
                  Android, and desktop.
                </p>
              </li>
              <li className={styles.reveal} data-reveal>
                <h3>Is Holdfast a personal CRM?</h3>
                <p>
                  No. It doesn&apos;t import your address book or ask you to fill in records. It
                  only knows the people you talk about, and only what you chose to say.
                </p>
              </li>
              <li className={styles.reveal} data-reveal>
                <h3>How is it different from a friend notes app?</h3>
                <p>
                  You talk instead of typing. It keeps track of what you said you&apos;d do, not
                  just what they told you. And it reminds you around what&apos;s happening in
                  their life, like the day after a big appointment.
                </p>
              </li>
              <li className={styles.reveal} data-reveal>
                <h3>What if I forget to send a voice note?</h3>
                <p>
                  Nothing is lost. Holdfast keeps everything you&apos;ve already told it. If weeks
                  go by without a note about someone, it may let you know you two haven&apos;t
                  spoken in a while.
                </p>
              </li>
              <li className={styles.reveal} data-reveal>
                <h3>How many reminders will I get?</h3>
                <p>
                  Three a week, at most. When more is due, the most important ones go first, like
                  a promise you made.
                </p>
              </li>
              <li className={styles.reveal} data-reveal>
                <h3>Do you keep my recordings?</h3>
                <p>
                  No. We delete the audio as soon as the text is saved. Your own copy stays in
                  your Telegram chat. <a href="#privacy">See where your voice note goes</a>.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.cta} id="join">
          <div className={`${styles.wrap} ${styles.ctaPanel}`}>
            <h2>Say it out loud once. Holdfast remembers the rest.</h2>
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
            &copy; 2026 Holdfast. <a href="mailto:hello@useholdfast.co">hello@useholdfast.co</a>
          </p>
        </div>
      </footer>

      <ScrollReveal />
    </div>
  );
}
