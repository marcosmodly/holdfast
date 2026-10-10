'use client';

import { PixelCanvas, type PaintFrame, type PixelSize } from './pixel-canvas';
import { bandColor, block, dither, dot, drawSprite, hash2, PixelBuffer, rgb, seededRandom, wrap } from './paint';
import { BOAT, BOAT_AT_NIGHT } from './sprites';

// The closing panel: the hero's sea after dark. A lighthouse sweeps its beam
// over the water and the little boat comes home with its lantern lit. The
// panel's text sits on top, so the busy parts stay low and to the sides.

const SEED = 1221;
// Rows of sea under the horizon. Counting from the bottom, not as a share of
// the height, keeps the horizon below the form when the panel grows taller
// on phones.
const SEA_ROWS = 26;

const SKY = ['#161c3a', '#1b2244', '#212850', '#29305b', '#333764', '#3f3f6c', '#4c4672'].map(rgb);
const SEA = ['#2a3160', '#222852', '#1b2144', '#151a37', '#11152d'].map(rgb);
const HORIZON = rgb('#5b5585');
const MOON = { light: rgb('#f6efd9'), crater: rgb('#e0d5b6'), halo: rgb('#2d3466') };
const ROCK = { top: rgb('#3a3f62'), body: rgb('#262a45') };
const STAR = { bright: '#f6efe2', dim: '#7c7ea8' };

const LIGHTHOUSE = [
  '....r....',
  '...rrR...',
  '..rrrrR..',
  '..kLLLk..',
  '..kLLLk..',
  '.ggggggg.',
  '..wwwwW..',
  '..wwwwW..',
  '..wwwwW..',
  '..rrrrR..',
  '..rrrrR..',
  '..rrrrR..',
  '.wwwwwWW.',
  '.wwwdwWW.',
  '.wwwwwWW.',
  '.rrrrrRR.',
  '.rrrrrRR.',
  '.rrrrrRR.',
  '.wwwwwWW.',
  '.wwwwwWW.',
  'wwwwwwwWW',
  'rrrrrrrRR',
  'rrrrrrrRR',
  'wwwddwwWW',
  'wwwddwwWW',
];
const LIGHTHOUSE_PALETTE = {
  r: '#c8643a',
  R: '#8e3f1e',
  w: '#efe8dc',
  W: '#a3a1bb',
  k: '#2a2320',
  L: '#ffe7a3',
  g: '#3a3550',
  d: '#2a2320',
};

interface Star {
  x: number;
  y: number;
  speed: number;
  phase: number;
}

const prepareNightSea = ({ width: W, height: H }: PixelSize): PaintFrame => {
  const random = seededRandom(SEED);
  const horizon = H - SEA_ROWS;
  // Tucked into the top-right corner, above where the heading starts.
  const moonR = 7;
  const moonX = W - 15;
  const moonY = 12;

  const buffer = new PixelBuffer(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y < horizon) buffer.set(x, y, bandColor(SKY, y / horizon, x, y));
      else if (y === horizon) buffer.set(x, y, HORIZON);
      else buffer.set(x, y, bandColor(SEA, (y - horizon) / (H - horizon), x, y));
    }
  }

  // A full moon with a soft, dithered halo.
  for (let y = moonY - moonR - 5; y <= moonY + moonR + 5; y++) {
    for (let x = moonX - moonR - 5; x <= moonX + moonR + 5; x++) {
      const d = Math.hypot(x - moonX, y - moonY);
      if (d <= moonR) {
        const crater = hash2(x * 3, y * 5) < 0.12 && d < moonR - 1;
        buffer.set(x, y, crater ? MOON.crater : MOON.light);
      } else if (d <= moonR + 5 && dither(x, y, 1 - (d - moonR) / 5)) {
        buffer.set(x, y, MOON.halo);
      }
    }
  }

  // The lighthouse's island: a low mound of rock on the horizon.
  const lighthouseX = Math.max(3, Math.round(W * 0.06));
  const islandCx = lighthouseX + 4;
  for (let x = islandCx - 13; x <= islandCx + 13; x++) {
    const d = Math.abs(x - islandCx) / 13;
    const tall = Math.round(5 * (1 - d * d)) + Math.round(hash2(x, 1));
    for (let k = -2; k < tall; k++) buffer.set(x, horizon - k, k === tall - 1 ? ROCK.top : ROCK.body);
  }
  const islandTop = horizon - 4;

  const backdrop = buffer.toCanvas();
  const bctx = backdrop.getContext('2d');
  if (bctx) drawSprite(bctx, LIGHTHOUSE, LIGHTHOUSE_PALETTE, lighthouseX, islandTop - LIGHTHOUSE.length + 1);
  const lampX = lighthouseX + 4;
  const lampY = islandTop - LIGHTHOUSE.length + 4;

  const stars: Star[] = [];
  for (let i = 0; i < Math.round((W * horizon) / 90); i++) {
    const x = Math.floor(random() * W);
    const y = Math.floor(random() * (horizon - 3));
    if (Math.hypot(x - moonX, y - moonY) < moonR + 6) continue;
    stars.push({ x, y, speed: 0.5 + random() * 1.8, phase: random() * 10 });
  }

  return (ctx, t) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(backdrop, 0, 0);

    for (const star of stars) {
      const s = Math.sin(t * star.speed + star.phase);
      dot(ctx, star.x, star.y, s > 0.1 ? STAR.bright : STAR.dim);
    }

    // Now and then, a shooting star across the top.
    const shoot = t % 9;
    if (shoot < 0.6) {
      const k = shoot / 0.6;
      const hx = Math.round(W * 0.3 + k * 36);
      const hy = Math.round(4 + k * 9);
      ['#f6efe2', '#c9c3d8', '#8f8bb0', '#5d5d88'].forEach((color, i) => {
        dot(ctx, hx - i * 2, hy - Math.round(i * 0.5), color);
      });
    }

    // The moon's path on the water.
    const shimmer = Math.floor(t * 3);
    for (let r = 1; r < H - horizon; r++) {
      for (let k = 0; k < 2; k++) {
        if (hash2(r * 11 + k, shimmer) < 0.35) continue;
        const spread = 2 + r * 1.2;
        const x = Math.round(moonX + (hash2(r, k * 7 + shimmer) - 0.5) * 2 * spread);
        block(ctx, x, horizon + r, 2 + Math.floor(hash2(k, r) * 3), 1, r < 6 ? '#efe6c4' : '#9d98b8');
      }
    }
    // Small waves everywhere else.
    ctx.fillStyle = 'rgba(120, 128, 190, 0.35)';
    for (let r = 2; r < H - horizon; r += 2) {
      for (let k = 0; k < W / 20; k++) {
        if (hash2(r * 131 + k, Math.floor(t * 1.5)) < 0.55) continue;
        ctx.fillRect(Math.floor(hash2(k * 17 + r, shimmer) * W), horizon + r, 2, 1);
      }
    }

    // The beam turns round: long to one side, gone as it faces us, long to
    // the other. A flash at the lamp marks the moment it points our way.
    const turn = Math.cos(t * 0.9);
    const reach = Math.round(turn * W * 0.55);
    const dir = Math.sign(reach);
    let lastStyle = '';
    for (let d = 3; d <= Math.abs(reach); d++) {
      const fade = Math.ceil((1 - d / (W * 0.55)) * 4) / 4;
      const style = `rgba(255, 236, 170, ${(0.18 * fade).toFixed(3)})`;
      if (style !== lastStyle) {
        ctx.fillStyle = style;
        lastStyle = style;
      }
      const half = Math.round(0.8 + d * 0.1);
      ctx.fillRect(lampX + dir * d, lampY - half, 1, half * 2 + 1);
    }
    if (Math.abs(turn) < 0.25) {
      block(ctx, lampX - 2, lampY - 1, 5, 3, 'rgba(255, 247, 214, 0.55)');
      block(ctx, lampX - 1, lampY - 2, 3, 5, 'rgba(255, 247, 214, 0.55)');
    }

    // The boat, heading home slowly, lantern blinking.
    const boatX = Math.round(wrap(W * 0.62 - t * 0.6, W + 30) - 15);
    const bob = Math.round(Math.sin(t * 1.4));
    drawSprite(ctx, BOAT, BOAT_AT_NIGHT, boatX, horizon - 7 + bob, true);
    if (Math.floor(t * 1.5) % 2 === 0) dot(ctx, boatX + 5, horizon - 8 + bob, '#fff1c1');
    block(ctx, boatX + 3, horizon + 5 + bob, 3, 1, 'rgba(255, 215, 122, 0.5)');
  };
};

function nightSeaPixelSize(boxWidth: number): number {
  return boxWidth < 640 ? 3 : 4;
}

export function NightSeaScene({ className }: { className?: string }) {
  return (
    <PixelCanvas prepare={prepareNightSea} pixelSize={nightSeaPixelSize} fps={12} stillTime={4} className={className} />
  );
}
