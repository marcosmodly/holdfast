'use client';

import { PixelCanvas, type PaintFrame, type PixelSize } from './pixel-canvas';
import { bandColor, block, dither, dot, drawSprite, hash2, PixelBuffer, rgb, seededRandom } from './paint';

// Two friends talking by a campfire under the stars, for the dark "No app can
// import the people you love" section. The layout adapts to the box size.

const SEED = 1990;
const INK = '#2a2320';

const NIGHT = ['#1a1722', '#1e1a27', '#24202d', '#2c2431', '#382a33'].map(rgb);
const HILLS = rgb('#2a2230');
const GROUND = ['#3b2f2b', '#342927', '#2d2322'].map(rgb);
const GRASS = rgb('#4d3e33');
const PINE = rgb('#211b22');
const MOON = rgb('#f4e8d0');
const STAR_BRIGHT = '#f6efe2';
const STAR_DIM = '#6f6678';

// Sitting, facing right. The friend across the fire is the same sprite mirrored.
const SITTER = [
  '..hhhh....',
  '.hhhhhh...',
  '.hhhhsss..',
  '.hhhsses..',
  '.hhhssss..',
  '..hhsss...',
  '...cccc...',
  '..cccccc..',
  '..ccccccs.',
  '..ccccc...',
  '..ccccc...',
  '..pppppp..',
  '..pppppppp',
  '.......pp.',
  '.......pp.',
  '......bbb.',
];
const FRIEND_A = { h: '#3b2a22', s: '#e9b48e', e: INK, c: '#3f7a7e', p: '#4a3f5c', b: INK };
const FRIEND_B = { h: '#a8552f', s: '#c98f6a', e: INK, c: '#e6b54d', p: '#3b4a5c', b: INK };

const BUBBLE = ['.wwwwwwwww.', 'wwwwwwwwwww', 'wwwwwwwwwww', 'wwwwwwwwwww', '.wwwwwwwww.', '.ww........', 'w..........'];

interface Star {
  x: number;
  y: number;
  speed: number;
  phase: number;
  big: boolean;
}

// A soft, banded pool of firelight, painted once and stamped every frame.
function makeGlow(radius: number): HTMLCanvasElement {
  const size = radius * 2 + 1;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const alphas = [0, 0.06, 0.13, 0.22];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - radius, (y - radius) * 1.5) / radius;
      if (d >= 1) continue;
      const level = (1 - d) * (alphas.length - 1);
      let i = Math.floor(level);
      if (dither(x, y, level - i)) i += 1;
      if (i === 0) continue;
      dot(ctx, x, y, `rgba(255, 170, 90, ${alphas[Math.min(i, alphas.length - 1)]})`);
    }
  }
  return canvas;
}

const prepareCampfire = ({ width: W, height: H }: PixelSize): PaintFrame => {
  const random = seededRandom(SEED);
  const groundY = H - 16;
  const fireX = Math.round(W / 2);
  const fireBase = groundY + 8;
  const hillTop = (x: number) => groundY - 7 + Math.round(3 * Math.sin(x * 0.07 + 1) + 2 * Math.sin(x * 0.19));
  const groundTop = (x: number) => groundY + Math.round(Math.sin(x * 0.09));

  const buffer = new PixelBuffer(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y >= groundTop(x)) buffer.set(x, y, bandColor(GROUND, (y - groundY) / (H - groundY), x, y));
      else if (y >= hillTop(x)) buffer.set(x, y, HILLS);
      else buffer.set(x, y, bandColor(NIGHT, y / (groundY - 4), x, y));
    }
  }
  for (let x = 0; x < W; x++) {
    if (random() < 0.4) buffer.set(x, groundTop(x), GRASS);
  }

  // Pines on the hills at both edges, clear of the fire and the friends.
  for (const x of [6, 13, W - 14, W - 7]) {
    const base = hillTop(x);
    const tall = 12 + Math.floor(random() * 8);
    for (let r = 0; r < tall; r++) {
      const half = Math.floor((r % 6) * 0.6 + r / 5);
      for (let dx = -half; dx <= half; dx++) buffer.set(x + dx, base - tall + r, PINE);
    }
    buffer.set(x, base, PINE);
  }

  // A crescent moon: one disc with a second, offset disc taken out of it.
  const mx = W - 16;
  const my = 10;
  for (let y = my - 5; y <= my + 5; y++) {
    for (let x = mx - 5; x <= mx + 5; x++) {
      const inMoon = (x - mx) ** 2 + (y - my) ** 2 <= 25;
      const inShadow = (x - mx + 3) ** 2 + (y - my + 1) ** 2 <= 22;
      if (inMoon && !inShadow) buffer.set(x, y, MOON);
    }
  }

  const backdrop = buffer.toCanvas();
  const bctx = backdrop.getContext('2d');
  const seatY = groundY + 6;
  const friendA = { x: fireX - 22, y: seatY - 13 };
  const friendB = { x: fireX + 13, y: seatY - 13 };
  if (bctx) {
    // Logs to sit on, then the stones and wood of the fire pit.
    for (const lx of [friendA.x, friendB.x + 2]) {
      block(bctx, lx, seatY, 8, 1, '#8a6243');
      block(bctx, lx, seatY + 1, 8, 2, '#6b4a32');
      dot(bctx, lx, seatY + 1, '#b08a62');
    }
    for (const dx of [-7, -4, 3, 6]) {
      block(bctx, fireX + dx, fireBase + 1, 2, 1, '#77706a');
      block(bctx, fireX + dx, fireBase + 2, 2, 1, '#5d5552');
    }
    block(bctx, fireX - 5, fireBase + 1, 11, 1, '#5a3a28');
    dot(bctx, fireX - 4, fireBase, '#6b4a32');
    dot(bctx, fireX + 4, fireBase, '#6b4a32');
  }

  const stars: Star[] = [];
  for (let i = 0; i < Math.round((W * H) / 80); i++) {
    const x = Math.floor(random() * W);
    const y = Math.floor(random() * (hillTop(x) - 4));
    if (Math.abs(x - mx) < 8 && Math.abs(y - my) < 8) continue;
    stars.push({ x, y, speed: 0.6 + random() * 1.6, phase: random() * 10, big: random() < 0.12 });
  }

  const glows = [makeGlow(24), makeGlow(26)];

  return (ctx, t) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(backdrop, 0, 0);

    for (const star of stars) {
      const s = Math.sin(t * star.speed + star.phase);
      dot(ctx, star.x, star.y, s > 0.2 ? STAR_BRIGHT : STAR_DIM);
      if (star.big && s > 0.85) {
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) dot(ctx, star.x + dx, star.y + dy, STAR_DIM);
      }
    }

    // Now and then, a shooting star.
    const shoot = t % 11;
    if (shoot < 0.7) {
      const k = shoot / 0.7;
      const hx = Math.round(W * 0.12 + k * 28);
      const hy = Math.round(4 + k * 8);
      const trail = ['#f6efe2', '#c9bfb4', '#8d8293', '#5a5262'];
      trail.forEach((color, i) => dot(ctx, hx - i * 2, hy - Math.round(i * 0.6), color));
    }

    drawSprite(ctx, SITTER, FRIEND_A, friendA.x, friendA.y);
    drawSprite(ctx, SITTER, FRIEND_B, friendB.x, friendB.y, true);

    // Firelight washes over the friends, then the fire itself.
    const tick = Math.floor(t * 10);
    const glow = glows[hash2(tick, 3) < 0.5 ? 0 : 1];
    ctx.drawImage(glow, fireX - (glow.width >> 1), fireBase - 4 - (glow.height >> 1));
    drawFire(ctx, fireX, fireBase, t, tick);

    for (let i = 0; i < 7; i++) {
      const life = ((t + i * 0.37) % 1.8) / 1.8;
      if (life > 0.85) continue;
      const x = Math.round(fireX + Math.sin(life * 5 + i * 2) * 3 + (hash2(i, 7) - 0.5) * 6);
      const y = Math.round(fireBase - 8 - life * 22);
      dot(ctx, x, y, life < 0.5 ? '#ffd77a' : '#f08a3c');
    }

    // They take turns talking.
    const aTalks = Math.floor(t / 3.5) % 2 === 0;
    const bx = aTalks ? friendA.x + 6 : friendB.x - 7;
    const by = friendA.y - 9;
    drawSprite(ctx, BUBBLE, { w: '#fffdfb' }, bx, by, !aTalks);
    const dots = Math.floor(t * 2.5) % 4;
    for (let d = 0; d < dots; d++) dot(ctx, bx + 3 + d * 2, by + 2, INK);
  };
};

function drawFire(ctx: CanvasRenderingContext2D, cx: number, base: number, t: number, tick: number): void {
  const tall = 9 + Math.round(hash2(tick, 1) * 2);
  for (let r = 0; r < tall; r++) {
    const f = r / tall; // 0 at the base, 1 at the tip
    const half = Math.max(0, Math.round((1 - f) * 4 + (hash2(tick, r) - 0.5) * 1.5));
    const lean = Math.round(Math.sin(t * 6 + r * 0.6) * f * 1.5);
    for (let dx = -half; dx <= half; dx++) {
      const edge = Math.abs(dx) / Math.max(1, half);
      let color = '#ffd77a';
      if (f > 0.75 || edge > 0.7) color = '#d9542c';
      else if (f > 0.45 || edge > 0.35) color = '#f08a3c';
      else if (f < 0.25 && edge < 0.3) color = '#fff1c1';
      dot(ctx, cx + dx + lean, base - r, color);
    }
  }
}

// About 88 art pixels across at any box width, so the friends and the fire
// stay a readable size.
function campfirePixelSize(boxWidth: number): number {
  return Math.max(3, Math.round(boxWidth / 88));
}

export function CampfireScene({ className }: { className?: string }) {
  return (
    <PixelCanvas prepare={prepareCampfire} pixelSize={campfirePixelSize} fps={10} stillTime={1} className={className} />
  );
}
