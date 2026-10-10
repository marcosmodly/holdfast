'use client';

import { useEffect, useRef } from 'react';
import styles from './pixel.module.css';

export interface PixelSize {
  /** Canvas size in art pixels. */
  width: number;
  height: number;
  /** CSS pixels per art pixel. */
  pixelSize: number;
}

/** Paints one frame. `t` is seconds since the scene started. */
export type PaintFrame = (ctx: CanvasRenderingContext2D, t: number) => void;

/**
 * Lays a scene out for one canvas size and returns its frame painter. Runs
 * again whenever the box changes size.
 */
export type PrepareScene = (size: PixelSize, box: HTMLElement) => PaintFrame;

interface PixelCanvasProps {
  /** Define it at module level: a new function on every render restarts the scene. */
  prepare: PrepareScene;
  /** CSS pixels per art pixel, or a function of the box width in CSS pixels. */
  pixelSize: number | ((boxWidth: number) => number);
  fps?: number;
  /** The moment painted, once, for visitors who prefer reduced motion. */
  stillTime?: number;
  className?: string;
}

// A decorative pixel-art canvas that fills its box. The box gets its size
// from the parent's CSS. Animation runs only while the box is on screen, at a
// low frame rate on purpose: choppy motion is part of the pixel-art look.
export function PixelCanvas({ prepare, pixelSize, fps = 12, stillTime = 0, className }: PixelCanvasProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!box || !canvas || !ctx) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const clock = () => (still ? stillTime : (performance.now() - start) / 1000);
    let paint: PaintFrame | null = null;
    let raf = 0;
    let lastPaint = 0;

    const resize = () => {
      const boxWidth = box.clientWidth;
      const boxHeight = box.clientHeight;
      if (boxWidth === 0 || boxHeight === 0) return;
      const px = typeof pixelSize === 'function' ? pixelSize(boxWidth) : pixelSize;
      const width = Math.ceil(boxWidth / px);
      const height = Math.ceil(boxHeight / px);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width * px}px`;
      canvas.style.height = `${height * px}px`;
      paint = prepare({ width, height, pixelSize: px }, box);
      paint(ctx, clock());
    };

    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      if (time - lastPaint < 1000 / fps) return;
      lastPaint = time;
      paint?.(ctx, clock());
    };

    const resizer = new ResizeObserver(resize);
    resizer.observe(box);

    const watcher = new IntersectionObserver(([entry]) => {
      if (still) return;
      if (entry.isIntersecting && raf === 0) raf = requestAnimationFrame(tick);
      if (!entry.isIntersecting && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    watcher.observe(box);

    return () => {
      resizer.disconnect();
      watcher.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [prepare, pixelSize, fps, stillTime]);

  return (
    <div ref={boxRef} className={className ? `${styles.box} ${className}` : styles.box} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
