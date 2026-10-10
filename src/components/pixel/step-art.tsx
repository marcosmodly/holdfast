'use client';

import { PixelCanvas, type PrepareScene } from './pixel-canvas';
import { block, clamp, dot, drawSprite, paperCard, roundRect } from './paint';
import { BUST, HEART, HEART_COLORS, YOU } from './sprites';

// Small looping pixel illustrations for the three "how it works" steps. Each
// is drawn on a 48 x 32 art-pixel stage, at 4 CSS pixels per art pixel. The
// stage sits at the bottom of its canvas, so the talker's shoulders meet the
// tile's bottom edge; any space above it is headroom.

const STAGE_W = 48;
const STAGE_H = 32;

const INK = '#2a2320';
const ACCENT = '#b4552d';
const ACCENT_DEEP = '#8e3f1e';
const CREAM = '#fbf7f2';
const LINE = '#e3d8ca';
const TEXT = '#d3c5b3';
const GOLD = '#e6b54d';
const TEAL = '#3f7a7e';

// Where the stage sits: centred across, flush with the bottom.
function stageOrigin(width: number, height: number): [number, number] {
  return [Math.floor((width - STAGE_W) / 2), height - STAGE_H];
}

// --- 1. Say what happened: someone talking into their phone. ---

const PHONE_IN_HAND = ['ppp.', 'pPp.', 'pPp.', 'ppp.', 'sss.', '.ss.', '.cc.', '.cc.'];
const BAR_PEAKS = [2, 4, 5, 3, 2];

const prepareTalk: PrepareScene = ({ width, height }) => {
  const [ox, oy] = stageOrigin(width, height);
  return (ctx, t) => {
    ctx.clearRect(0, 0, width, height);
    const talking = t % 3.2 < 2.4;

    const px = ox + 4;
    const py = oy + 14;
    drawSprite(ctx, BUST, YOU, px, py);
    if (talking && Math.floor(t * 7) % 2 === 0) block(ctx, px + 6, py + 7, 2, 2, YOU.m);
    drawSprite(ctx, PHONE_IN_HAND, YOU, px + 11, py + 4);

    // The voice note, as a speech bubble like the Holdfast logo.
    const bx = ox + 21;
    const by = oy + 2;
    roundRect(ctx, bx, by, 24, 15, ACCENT);
    block(ctx, bx + 2, by + 15, 3, 1, ACCENT);
    block(ctx, bx + 1, by + 16, 2, 1, ACCENT);
    dot(ctx, bx, by + 17, ACCENT);
    for (let i = 0; i < BAR_PEAKS.length; i++) {
      const level = talking ? 0.3 + 0.7 * Math.abs(Math.sin(t * 4.2 + i * 1.1)) : 0.15;
      const half = Math.round(level * BAR_PEAKS[i]);
      block(ctx, bx + 3 + i * 4, by + 7 - half, 2, half * 2 + 1, CREAM);
    }
  };
};

// --- 2. Holdfast sorts it out: the note splits into person, date, promise. ---

const PERSON_ICON = ['.rrr.', '.rrr.', '.....', '.rrr.', 'rrrrr'];
const CALENDAR_ICON = ['RRRRR', 'RRRRR', 'g...g', 'g.k.g', 'ggggg'];
const CHECK_ICON = ['....t', '...tt', 't.tt.', 'ttt..', '.t...'];
const ICONS = [PERSON_ICON, CALENDAR_ICON, CHECK_ICON];
const ICON_PALETTE = { r: '#c8643a', R: '#c8643a', g: '#c9b9a5', k: INK, t: TEAL };
const CHIP_COLORS = ['#c8643a', GOLD, TEAL];
const SORT_LOOP = 5;

const prepareSort: PrepareScene = ({ width, height }) => {
  const [ox, oy] = stageOrigin(width, height);
  return (ctx, t) => {
    ctx.clearRect(0, 0, width, height);
    const p = t % SORT_LOOP;

    const vx = ox + 2;
    const vy = oy + 11;
    roundRect(ctx, vx, vy, 13, 9, ACCENT);
    block(ctx, vx + 2, vy + 9, 2, 1, ACCENT);
    dot(ctx, vx + 1, vy + 10, ACCENT);
    for (let i = 0; i < 4; i++) {
      const half = 1 + Math.round(Math.abs(Math.sin(t * 3 + i)) * 2);
      block(ctx, vx + 3 + i * 2, vy + 4 - half, 1, half * 2 + 1, CREAM);
    }

    for (let i = 0; i < ICONS.length; i++) {
      const cx = ox + 25;
      const cy = oy + 2 + i * 10;
      const arrive = 0.4 + i * 1.1;
      const landed = p >= arrive + 0.5 && p < SORT_LOOP - 0.4;

      if (!landed) {
        // Empty slot, dashed.
        for (let x = cx; x < cx + 20; x += 2) {
          dot(ctx, x, cy, LINE);
          dot(ctx, x, cy + 7, LINE);
        }
        for (let y = cy + 2; y < cy + 7; y += 2) {
          dot(ctx, cx, y, LINE);
          dot(ctx, cx + 19, y, LINE);
        }
      }

      if (p >= arrive && p < arrive + 0.5) {
        // A chip of the note flying over to its slot.
        const k = (p - arrive) / 0.5;
        const sx = vx + 13;
        const sy = vy + 3;
        const ex = cx - 2;
        const ey = cy + 3;
        const x = Math.round(sx + (ex - sx) * k);
        const y = Math.round(sy + (ey - sy) * k - Math.sin(k * Math.PI) * 5);
        block(ctx, x, y, 2, 2, CHIP_COLORS[i]);
      }

      if (landed) {
        const lift = p < arrive + 0.65 ? 1 : 0;
        paperCard(ctx, cx, cy - lift, 20, 8);
        drawSprite(ctx, ICONS[i], ICON_PALETTE, cx + 2, cy + 1 - lift);
        // The promise is the line that matters most, so it's in the accent.
        block(ctx, cx + 9, cy + 2 - lift, 9, 1, i === 2 ? ACCENT : TEXT);
        block(ctx, cx + 9, cy + 5 - lift, 6, 1, TEXT);
        if (p < arrive + 0.9) {
          const sx = cx + 20;
          const sy = cy - 1;
          for (const [dx, dy] of [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) dot(ctx, sx + dx, sy + dy, GOLD);
        }
      }
    }
  };
};

// --- 3. It finds you at the right moment: a bell, a nudge, a heart. ---

const BELL = [
  '......k......',
  '.....yyy.....',
  '....yYYYy....',
  '...yYyyyyy...',
  '...yYyyyyy...',
  '...yyyyyyy...',
  '..yyyyyyyyy..',
  '..yyyyyyyyy..',
  '.yyyyyyyyyyy.',
  'yyyyyyyyyyyyy',
  'ooooooooooooo',
  '.....ccc.....',
  '......c......',
];
const BELL_PALETTE = { k: '#8e6a20', y: '#e9b949', Y: '#f7dc8a', o: '#b8862a', c: ACCENT_DEEP };
const NUDGE_LOOP = 4.2;

const prepareNudge: PrepareScene = ({ width, height }) => {
  const [ox, oy] = stageOrigin(width, height);
  return (ctx, t) => {
    ctx.clearRect(0, 0, width, height);
    const p = t % NUDGE_LOOP;

    // The nudge slides in from the right, stays a while, then slides away.
    const slideIn = clamp((p - 0.1) / 0.4, 0, 1);
    const slideOut = clamp((p - 3.6) / 0.4, 0, 1);
    const nx = Math.round(ox + 22 + (1 - slideIn) * 30 + slideOut * 30);
    const ny = oy + 9;
    paperCard(ctx, nx, ny, 24, 14);
    roundRect(ctx, nx + 2, ny + 2, 4, 4, ACCENT);
    block(ctx, nx + 8, ny + 3, 13, 1, TEXT);
    block(ctx, nx + 8, ny + 5, 9, 1, TEXT);
    block(ctx, nx + 2, ny + 9, 17, 1, ACCENT);

    // The bell hangs on a string from the top of the tile and rings while
    // the nudge arrives.
    const bx = ox + 5;
    const by = oy + 9;
    block(ctx, bx + 6, 0, 1, by, LINE);
    const ring = p > 0.3 && p < 1.7 ? Math.sin((p - 0.3) * 14) * (1 - (p - 0.3) / 1.4) : 0;
    const tilt = Math.round(ring * 2);
    for (let r = 0; r < BELL.length; r++) {
      // Swings from the top; the clapper swings furthest.
      const shift = r >= 11 ? Math.round(tilt * 1.5) : Math.round((tilt * r) / 12);
      drawSprite(ctx, [BELL[r]], BELL_PALETTE, bx + shift, by + r);
    }
    if (Math.abs(ring) > 0.3) {
      for (const [dx, dy] of [[-2, 3], [-3, 4], [-3, 5], [-2, 6]]) {
        dot(ctx, bx + dx, by + dy, GOLD);
        dot(ctx, bx + 12 - dx, by + dy, GOLD);
      }
    }

    if (p > 1.0 && p < 2.8) {
      const k = (p - 1.0) / 1.8;
      drawSprite(ctx, HEART, HEART_COLORS, nx + 15, Math.round(ny - 2 - k * 10));
    }
  };
};

const PREPARE = { talk: prepareTalk, sort: prepareSort, nudge: prepareNudge };
// What reduced-motion visitors see: a moment where each scene reads on its own.
const STILL_TIME = { talk: 0.3, sort: 4.0, nudge: 1.5 };

export type StepArtKind = keyof typeof PREPARE;

export function StepArt({ kind, className }: { kind: StepArtKind; className?: string }) {
  return <PixelCanvas prepare={PREPARE[kind]} pixelSize={4} fps={12} stillTime={STILL_TIME[kind]} className={className} />;
}
