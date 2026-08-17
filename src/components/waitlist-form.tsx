'use client';

import { useId, useRef, useState, type FormEvent, type FocusEvent } from 'react';
import styles from '@/app/waitlist.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_MESSAGE = 'Please enter a valid email address.';
const SUCCESS_MESSAGE = "You're on the list. I'll be in touch.";
const ERROR_MESSAGE = 'Something went wrong. Please try again.';

interface WaitlistFormProps {
  source?: string;
  visibleLabel?: boolean;
}

type Status = 'idle' | 'submitting' | 'ok' | 'err';

export function WaitlistForm({ source, visibleLabel = true }: WaitlistFormProps) {
  const emailId = useId();
  const noteId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const validate = (value: string): boolean => EMAIL_RE.test(value.trim());

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const value = e.target.value.trim();
    if (value !== '' && !validate(value)) {
      setStatus('err');
      setMessage(INVALID_MESSAGE);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();

    if (!validate(value)) {
      setStatus('err');
      setMessage(INVALID_MESSAGE);
      emailRef.current?.focus();
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source, website }),
      });
      if (!res.ok) throw new Error('Request failed');

      setStatus('ok');
      setMessage(SUCCESS_MESSAGE);
      setEmail('');
      setWebsite('');
    } catch {
      setStatus('err');
      setMessage(ERROR_MESSAGE);
    }
  }

  const submitting = status === 'submitting';
  const hasError = status === 'err';

  return (
    <>
      <form className={styles.signup} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label
            className={visibleLabel ? undefined : styles.srOnly}
            htmlFor={emailId}
          >
            Email address
          </label>
          <input
            ref={emailRef}
            type="email"
            id={emailId}
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleBlur}
            aria-describedby={hasError ? noteId : undefined}
            aria-invalid={hasError || undefined}
          />
        </div>
        {/* Honeypot — hidden from sighted users and from assistive tech. */}
        <div className={styles.hp} aria-hidden="true">
          <label htmlFor={`${emailId}-website`}>Website</label>
          <input
            type="text"
            id={`${emailId}-website`}
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          {submitting ? 'Joining…' : 'Join the waitlist'}
        </button>
      </form>
      <p
        className={`${styles.formnote} ${hasError ? styles.err : ''} ${status === 'ok' ? styles.ok : ''}`}
        id={noteId}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </>
  );
}
