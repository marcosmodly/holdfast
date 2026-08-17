'use client';

import { useEffect } from 'react';
import styles from '@/app/waitlist.module.css';

// Ports the source page's scroll-reveal script. Targets a stable
// data-reveal attribute (CSS module class names are hashed at build time,
// so they can't be queried directly) and toggles the module's `.in` class.
export function ScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add(styles.in));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add(styles.in), i * 60);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
