'use client';

import { PixelCanvas, type PrepareScene } from './pixel-canvas';
import { block, clamp, dot, drawSprite, drawSpriteFaded } from './paint';
import { HEART, HEART_COLORS } from './sprites';

// Small looping pictures for the three friendship stats, on a 32 x 18
// art-pixel stage at 4 CSS pixels each: the box should be 128 x 72.

const STAGE_W = 32;
const STAGE_H = 18;
const GROUND = '#eadfce';
const WOOD = '#8a6243';
const WOOD_LIGHT = '#a87a52';
const WOOD_DARK = '#5a3a28';

function stageOrigin(width: number, height: number): [number, number] {
  return [Math.floor((width - STAGE_W) / 2), height - STAGE_H];
}

// A person standing, front view, 5 x 9. Colours come from a Friend.
const STANDING = ['.hhh.', 'hhhhh', 'hsssh', '.sss.', 'ccccc', 'ccccc', 'ccccc', '.p.p.', '.p.p.'];

// A type, not an interface, so a Friend can be passed straight in as a palette.
type Friend = { h: string; s: string; c: string; p: string };

const FRIENDS: Friend[] = [
  { h: '#3b2a22', s: '#e9b48e', c: '#3f7a7e', p: '#3b3550' },
  { h: '#a8552f', s: '#c98f6a', c: '#e6b54d', p: '#3b4a5c' },
  { h: '#1f1a17', s: '#8d5a3c', c: '#c8643a', p: '#3b3550' },
  { h: '#d9a441', s: '#f0c8a0', c: '#7a5a8a', p: '#4a3f5c' },
  { h: '#5a3a28', s: '#b07850', c: '#7a9a6a', p: '#3b4a5c' },
  { h: '#2a2320', s: '#e0a882', c: '#d98a8a', p: '#3b3550' },
];

// --- 12%: no close friends. One person on a bench built for two. ---

const SITTING = ['.hhhh.', 'hhhhhh', 'hesseh', '.ssss.', 'cccccc', 'cccccc', 'cccccc', 'pppppp', '.p..p.', '.b..b.'];
const LEAF = ['ol', '.o'];

const prepareAlone: PrepareScene = ({ width, height }) => {
  const [ox, oy] = stageOrigin(width, height);
  return (ctx, t) => {
    ctx.clearRect(0, 0, width, height);
    block(ctx, 0, oy + 16, width, 1, GROUND);

    const bx = ox + 3;
    const by = oy + 6;
    block(ctx, bx, by, 26, 1, WOOD_LIGHT);
    block(ctx, bx, by + 1, 26, 1, WOOD);
    block(ctx, bx, by + 3, 26, 1, WOOD);
    block(ctx, bx, by + 5, 26, 1, WOOD_LIGHT);
    block(ctx, bx, by + 6, 26, 1, WOOD);
    block(ctx, bx + 1, by + 7, 1, 3, WOOD_DARK);
    block(ctx, bx + 24, by + 7, 1, 3, WOOD_DARK);
    block(ctx, bx - 1, by + 2, 1, 6, '#4a4545');
    block(ctx, bx + 26, by + 2, 1, 6, '#4a4545');
    // Sits on the left end, lap on the seat, feet hanging in front of it.
    drawSprite(ctx, SITTING, { ...FRIENDS[0], e: '#2a2320', b: '#2a2320' }, bx + 3, by - 2);

    // A leaf drifts down onto the empty half of the bench, rests, and goes.
    const p = t % 6;
    if (p < 5) {
      const k = Math.min(1, p / 3.5);
      const x = bx + 18 + Math.round(Math.sin(p * 2.2) * 3 * (1 - k));
      const y = Math.round(oy + k * (by + 4 - oy));
      drawSprite(ctx, LEAF, { o: '#d9822b', l: '#e6b54d' }, x, y);
    }
  };
};

// --- 27%, down from 55%: a circle of six friends, half of them fading. ---

const CIRCLE_LOOP = 6.5;

const prepareCircle: PrepareScene = ({ width, height }) => {
  const [ox, oy] = stageOrigin(width, height);
  return (ctx, t) => {
    ctx.clearRect(0, 0, width, height);
    block(ctx, 0, oy + 16, width, 1, GROUND);
    const p = t % CIRCLE_LOOP;
    for (let i = 0; i < FRIENDS.length; i++) {
      // The three on the right fade one after another, then all come back.
      let amount = 1;
      if (i >= 3) {
        const start = 1.5 + (5 - i) * 0.7;
        amount = p < 5.6 ? clamp(1 - (p - start) / 0.5, 0.2, 1) : clamp(0.2 + ((p - 5.6) / 0.5) * 0.8, 0.2, 1);
      }
      drawSpriteFaded(ctx, STANDING, FRIENDS[i], ox + 1 + i * 5, oy + 7, amount);
    }
  };
};

// --- 200 hours: time running through an hourglass between two friends. ---

// Inner half-width of the glass, row by row; 0 is the neck.
const GLASS = [4, 4, 4, 3, 2, 1, 0, 1, 2, 3, 4, 4, 4];
const SAND = '#e6b54d';
const HOURS_LOOP = 6;

const prepareHours: PrepareScene = ({ width, height }) => {
  const [ox, oy] = stageOrigin(width, height);
  return (ctx, t) => {
    ctx.clearRect(0, 0, width, height);
    block(ctx, 0, oy + 16, width, 1, GROUND);
    drawSprite(ctx, STANDING, FRIENDS[0], ox + 3, oy + 7);
    drawSprite(ctx, STANDING, FRIENDS[1], ox + 24, oy + 7);

    const p = t % HOURS_LOOP;
    const drained = Math.min(1, p / 5);
    const gx = ox + 11; // left edge of the hourglass
    const cx = gx + 5;
    const top = oy + 2;

    block(ctx, gx, top, 11, 1, WOOD_LIGHT);
    block(ctx, gx, top + GLASS.length + 1, 11, 1, WOOD);
    block(ctx, gx, top + 1, 1, GLASS.length, WOOD_DARK);
    block(ctx, gx + 10, top + 1, 1, GLASS.length, WOOD_DARK);

    const topRows = Math.round((1 - drained) * 5);
    const bottomRows = Math.round(drained * 5);
    for (let r = 0; r < GLASS.length; r++) {
      const y = top + 1 + r;
      const half = GLASS[r];
      dot(ctx, cx - half - 1, y, '#c9b9a5');
      dot(ctx, cx + half + 1, y, '#c9b9a5');
      const inTop = r < 6 && r >= 6 - topRows;
      const inBottom = r > 6 && r >= GLASS.length - bottomRows;
      if (inTop || inBottom) block(ctx, cx - half, y, half * 2 + 1, 1, SAND);
    }
    // The falling stream, flickering.
    if (drained < 1) {
      for (let y = top + 7; y < top + 1 + GLASS.length - bottomRows; y++) {
        if ((y + Math.floor(t * 10)) % 3 !== 0) dot(ctx, cx, y, SAND);
      }
    }

    // When the time is up, a heart floats up out of the hourglass.
    if (p >= 5) {
      const k = p - 5;
      drawSprite(ctx, HEART, HEART_COLORS, cx - 3, Math.round(top + 2 - k * 10));
    }
  };
};

const PREPARE = { alone: prepareAlone, circle: prepareCircle, hours: prepareHours };
const STILL_TIME = { alone: 2, circle: 3.8, hours: 2.5 };

export type StatArtKind = keyof typeof PREPARE;

export function StatArt({ kind, className }: { kind: StatArtKind; className?: string }) {
  return <PixelCanvas prepare={PREPARE[kind]} pixelSize={4} fps={12} stillTime={STILL_TIME[kind]} className={className} />;
}
