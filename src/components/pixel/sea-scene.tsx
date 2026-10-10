'use client';

import { PixelCanvas, type PaintFrame, type PixelSize } from './pixel-canvas';
import {
  bandColor,
  block,
  clamp,
  dot,
  drawSprite,
  hash2,
  PixelBuffer,
  rgb,
  seededRandom,
  wrap,
} from './paint';
import { BOAT, BOAT_AT_DUSK } from './sprites';

// The hero backdrop: a dusk sky over a sea where kelp grips the rocks while
// the current pulls at its fronds. That grip is what a holdfast is.
//
// The page decides where things go. The sky runs from the top of the hero
// down to the horizon, which sits on the element marked `data-horizon` in the
// same section. The seabed fills the bottom SEABED art pixels, fading into
// the colour of the section below.

const SEED = 20261010;
const SEABED = 22; // rows of sand at the bottom
const CURRENT = 3; // how far, in art pixels, the current pushes the kelp tips

// Top of the sky to the horizon: evening blue, through lavender and rose,
// into the sunset. Light enough throughout for the hero's dark text.
const SKY = [
  '#9eb0e2',
  '#a9b8e3',
  '#b5bfe3',
  '#c2c5e2',
  '#cfcadf',
  '#dbcedb',
  '#e6d1d3',
  '#eed3c9',
  '#f2cfb9',
  '#f1c3a4',
  '#ecb08d',
  '#e69c78',
  '#df8a66',
].map(rgb);
const SUN = ['#fff6e6', '#ffeacb', '#fdd6a2', '#f8bd80'].map(rgb);
// Hills on the horizon, hazy with distance.
const HILL_FAR = { body: rgb('#c99ca4'), rim: rgb('#dcb2b2') };
const HILL_NEAR = { body: rgb('#b3838f'), rim: rgb('#c9989c') };
const WATER = ['#86ada3', '#6b9a94', '#548785', '#427478', '#35636b', '#2b545e', '#234853', '#1d3e49'].map(rgb);
// Ends on the stats section's background (--bg-warm).
const SAND = ['#6b6550', '#87795c', '#a59372', '#c1ad8a', '#d8c7a6', '#e9dcc4', '#f4ede4'].map(rgb);
const ROCK = ['#26323a', '#2f3e46', '#3b4d55', '#4c6068', '#62777c', '#7a8f8c'].map(rgb);
const HORIZON = rgb('#f6cba4');
const HORIZON_BRIGHT = rgb('#ffe9cb');
const MOSS = ['#56704a', '#6d8a52'].map(rgb);
const SEAGRASS = ['#4e6a4a', '#647f52', '#7a8f55'].map(rgb);

// High clouds are cool white; low ones catch the sunset.
const HIGH_CLOUD = { body: '#ffffff', mid: '#f1f1fb', shade: '#d3d1ec' };
const LOW_CLOUD = { body: '#fff6ec', mid: '#fbe3cf', shade: '#f2c7a8' };
const STAR = { bright: '#ffffff', glint: '#eef2ff' };
const MOON = rgb('#fffaf0');
const STREAK = { light: '#fbe8d6', shade: '#f0c6a7' };
const BIRD = '#7a4a36';
const BUBBLE = { body: '#a9cfc6', shine: '#effaf6', small: '#cfe6df' };

const KELP_FRONT = { stem: '#7a6a2a', blade: '#a68a35', light: '#cfae4c', bulb: '#5c4c1c', root: '#4b3a1a' };
// Back kelp is cooler and darker, so it reads as further away.
const KELP_BACK = { stem: '#3d5847', blade: '#4a6a50', light: '#5f8060', bulb: '#2e4638', root: '#2e4638' };

const FISH_COLORS = [
  { b: '#e8875a', l: '#f6b28c', t: '#c4643a', e: '#2a2320' },
  { b: '#e6b54d', l: '#f6d98e', t: '#b8862a', e: '#2a2320' },
  { b: '#d6e2da', l: '#f5f8f2', t: '#93aba5', e: '#2a2320' },
];

// Facing right. Flipped when a school swims left.
const FISH = ['t.lll.', 'ttbbeb', 't.bbb.'];

const BIRD_UP = ['b...b', '.b.b.', '..b..'];
const BIRD_DOWN = ['.....', 'bb.bb', '..b..'];

const STARFISH = ['..o..', 'ooooo', '.oOo.', '.o.o.'];
const STARFISH_PALETTE = { o: '#c8643a', O: '#e8915f' };

const CRAB_A = ['c.e.e.c', 'ccccccc', '.ccccc.', 'c.c.c.c'];
const CRAB_B = ['c.e.e.c', 'ccccccc', '.ccccc.', '.c.c.c.'];
const CRAB_PALETTE = { c: '#c8643a', e: '#2a2320' };

interface Rock {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface Kelp {
  x: number;
  base: number;
  height: number;
  phase: number;
  speed: number;
  sway: number;
  gap: number;
  back: boolean;
}

interface Cloud {
  sprite: HTMLCanvasElement;
  x: number;
  y: number;
  speed: number;
}

interface Bird {
  x: number;
  y: number;
  speed: number;
  phase: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  phase: number;
  big: boolean;
}

interface School {
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  colors: (typeof FISH_COLORS)[number];
  members: { dx: number; dy: number; phase: number }[];
}

interface Bubble {
  x: number;
  from: number;
  speed: number;
  cycle: number;
  offset: number;
  big: boolean;
}

interface Ray {
  x: number;
  width: number;
  depth: number;
  alpha: number;
  phase: number;
}

function seaPixelSize(boxWidth: number): number {
  return boxWidth < 640 ? 3 : 4;
}

// The horizon row, in art pixels from the top of the scene.
function findHorizon(box: HTMLElement, pixelSize: number, height: number): number {
  const marker = box.parentElement?.querySelector<HTMLElement>('[data-horizon]');
  const fallback = Math.round(height * 0.4);
  if (!marker) return fallback;
  const offset = marker.getBoundingClientRect().top - box.getBoundingClientRect().top;
  return clamp(Math.round(offset / pixelSize), 40, Math.max(40, height - SEABED - 30));
}

function rockTop(rock: Rock, x: number): number {
  const nx = (x - rock.cx) / rock.rx;
  if (Math.abs(nx) > 1) return Infinity;
  return rock.cy - Math.floor(rock.ry * Math.sqrt(1 - nx * nx));
}

function makeCloud(random: () => number, colors: typeof HIGH_CLOUD, scale = 1): HTMLCanvasElement {
  const width = Math.round((18 + Math.floor(random() * 26)) * scale);
  const height = Math.round(10 * scale);
  const base = height - 1;
  const puffs = 3 + Math.floor(random() * 3);
  const circles: { cx: number; cy: number; r: number }[] = [];
  for (let i = 0; i < puffs; i++) {
    // Middle puffs are the biggest, so clouds have a rounded top.
    const middle = 1 - Math.abs((i + 0.5) / puffs - 0.5) * 2;
    const r = (2.5 + middle * 3 + random() * 1.5) * scale;
    circles.push({ cx: 3 + ((i + 0.5) * (width - 6)) / puffs, cy: base - r * 0.7, r });
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  for (let y = 0; y <= base; y++) {
    for (let x = 0; x < width; x++) {
      const inside = circles.some((c) => (x - c.cx) ** 2 + (y - c.cy) ** 2 <= c.r * c.r);
      if (!inside) continue;
      dot(ctx, x, y, y === base ? colors.shade : y === base - 1 ? colors.mid : colors.body);
    }
  }
  return canvas;
}

const prepareSea = ({ width: W, height: H, pixelSize }: PixelSize, box: HTMLElement): PaintFrame => {
  const random = seededRandom(SEED);
  const horizon = findHorizon(box, pixelSize, H);
  const sunX = Math.round(W * 0.72);
  const sunR = clamp(Math.round(W * 0.04), 9, 16);
  const waterBottom = H - SEABED;

  // --- Seabed: a wavy sand line, then rocks half buried in it. ---
  const sandTop: number[] = [];
  for (let x = 0; x < W; x++) {
    sandTop.push(waterBottom + Math.round(2 * Math.sin(x * 0.045 + 0.7) + Math.sin(x * 0.11 + 2)));
  }

  const rocks: Rock[] = [];
  const rockCount = Math.max(3, Math.round(W / 30));
  for (let i = 0; i < rockCount; i++) {
    const cx = Math.floor(((i + 0.1 + random() * 0.8) * W) / rockCount);
    const rx = 7 + Math.floor(random() * 10);
    const ry = 6 + Math.floor(random() * 7);
    rocks.push({ cx, rx, ry, cy: sandTop[clamp(cx, 0, W - 1)] + Math.round(ry * 0.2) });
  }

  // The highest solid pixel in each column, sand or rock.
  const ground = sandTop.slice();
  for (const rock of rocks) {
    for (let x = rock.cx - rock.rx; x <= rock.cx + rock.rx; x++) {
      if (x >= 0 && x < W) ground[x] = Math.min(ground[x], rockTop(rock, x));
    }
  }

  // --- Static backdrop, painted once per size. ---
  const buffer = new PixelBuffer(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y < horizon) {
        buffer.set(x, y, bandColor(SKY, y / horizon, x, y));
      } else if (y === horizon) {
        buffer.set(x, y, Math.abs(x - sunX) < sunR * 1.6 ? HORIZON_BRIGHT : HORIZON);
      } else if (y < sandTop[x]) {
        buffer.set(x, y, bandColor(WATER, (y - horizon) / (waterBottom - horizon), x, y));
      } else {
        buffer.set(x, y, bandColor(SAND, (y - sandTop[x]) / Math.max(1, H - 1 - sandTop[x]), x, y));
      }
    }
  }

  // A sun that has half set: its centre sits just under the horizon.
  for (let y = horizon - sunR; y < horizon; y++) {
    for (let x = sunX - sunR; x <= sunX + sunR; x++) {
      const d = Math.hypot(x - sunX, y - (horizon + 2)) / sunR;
      if (d <= 1) buffer.set(x, y, bandColor(SUN, d, x, y, 0.35));
    }
  }

  // An early moon, top right, level with the header: nothing else is there
  // at any screen width.
  const moonX = W - 22;
  const moonY = 12;
  for (let y = moonY - 6; y <= moonY + 6; y++) {
    for (let x = moonX - 6; x <= moonX + 6; x++) {
      const inMoon = (x - moonX) ** 2 + (y - moonY) ** 2 <= 36;
      const inShadow = (x - moonX + 4) ** 2 + (y - moonY + 2) ** 2 <= 30;
      if (inMoon && !inShadow) buffer.set(x, y, MOON);
    }
  }

  // Hills along the horizon at both edges, clear of the sun. The near hill
  // sits behind the boat.
  const hills = [
    { cx: 0.1, half: 0.17, peak: 16, colors: HILL_FAR },
    { cx: 0.21, half: 0.08, peak: 8, colors: HILL_NEAR },
    { cx: 0.97, half: 0.12, peak: 11, colors: HILL_FAR },
  ];
  for (const hill of hills) {
    for (let x = 0; x < W; x++) {
      const d = Math.abs(x - hill.cx * W) / (hill.half * W);
      if (d >= 1) continue;
      const height = Math.round(hill.peak * (1 - d) ** 1.3 + 1.5 * Math.sin(x * 0.45) * (1 - d));
      for (let k = 1; k <= height; k++) buffer.set(x, horizon - k, k === height ? hill.colors.rim : hill.colors.body);
    }
  }

  // Thin streaks of cloud low in the glow, below the hero text (higher up
  // they read as stray underlines). The first one crosses the sun.
  const streaks = [{ y: horizon - 5, x0: sunX - sunR - 14, x1: sunX + sunR + 6 }];
  for (let i = 0; i < Math.max(2, Math.round(W / 120)); i++) {
    const x0 = Math.floor(random() * W);
    streaks.push({ y: horizon - 10 - Math.floor(random() * 12), x0, x1: x0 + 20 + Math.floor(random() * 30) });
  }
  for (const s of streaks) {
    for (let x = s.x0; x <= s.x1; x++) buffer.set(x, s.y, rgb(STREAK.light));
    for (let x = s.x0 + 3; x <= s.x1 - 3; x++) buffer.set(x, s.y + 1, rgb(STREAK.shade));
  }

  // Seagrass tufts on open sand.
  for (let i = 0; i < Math.round(W / 8); i++) {
    const x = Math.floor(random() * W);
    if (ground[x] < sandTop[x]) continue;
    const tall = 2 + Math.floor(random() * 3);
    const color = SEAGRASS[Math.floor(random() * SEAGRASS.length)];
    for (let k = 1; k <= tall; k++) buffer.set(x, sandTop[x] - k, color);
  }

  // Rocks, lit from above and to the left.
  for (const rock of rocks) {
    for (let y = rock.cy - rock.ry; y <= rock.cy + rock.ry; y++) {
      for (let x = rock.cx - rock.rx; x <= rock.cx + rock.rx; x++) {
        if (x < 0 || x >= W || y > sandTop[x] + 1) continue;
        const nx = (x - rock.cx) / rock.rx;
        const ny = (y - rock.cy) / rock.ry;
        if (nx * nx + ny * ny > 1) continue;
        const light = clamp((1 - 0.5 * nx - 0.9 * ny) / 2, 0, 1);
        buffer.set(x, y, bandColor(ROCK, light, x, y));
      }
    }
    for (let k = 0; k < rock.rx; k++) {
      const x = rock.cx - rock.rx + Math.floor(random() * rock.rx * 2);
      if (x >= 0 && x < W) buffer.set(x, rockTop(rock, x), MOSS[k % MOSS.length]);
    }
  }

  const backdrop = buffer.toCanvas();
  const backdropCtx = backdrop.getContext('2d');
  if (backdropCtx) {
    for (let i = 0; i < 2; i++) {
      const x = Math.floor(((i + 0.3 + random() * 0.4) * W) / 2);
      if (x + 5 < W && ground[x] === sandTop[x]) {
        drawSprite(backdropCtx, STARFISH, STARFISH_PALETTE, x, sandTop[x] + 2 + Math.floor(random() * 3));
      }
    }
  }

  // --- Things that move. Positions are pure functions of time. ---
  // Low, sunset-coloured clouds just above the horizon.
  const clouds: Cloud[] = [];
  for (let i = 0; i < Math.max(2, Math.round(W / 110)); i++) {
    clouds.push({
      sprite: makeCloud(random, LOW_CLOUD),
      x: random() * W,
      y: horizon - 27 + Math.floor(random() * 7),
      speed: 0.4 + random() * 0.8,
    });
  }

  // The sky has its own seed, so adding to it never moves the kelp and rocks.
  const skyRandom = seededRandom(SEED + 1);
  // High clouds drift along the header strip only. Lower down they pass
  // behind the headline and look like a highlighter.
  const highClouds: Cloud[] = [];
  for (let i = 0; i < Math.max(2, Math.round(W / 150)); i++) {
    highClouds.push({
      sprite: makeCloud(skyRandom, HIGH_CLOUD, 1.3),
      x: skyRandom() * W,
      y: 2 + Math.floor(skyRandom() * 4),
      speed: 0.3 + skyRandom() * 0.5,
    });
  }

  // Stars come out in the blue at the top of the sky, thinning towards the sunset.
  const stars: Star[] = [];
  for (let i = 0; i < Math.round((W * horizon) / 900); i++) {
    const star = {
      x: Math.floor(skyRandom() * W),
      y: Math.floor(horizon * 0.5 * skyRandom() ** 1.6),
      speed: 0.5 + skyRandom() * 1.5,
      phase: skyRandom() * 10,
      big: skyRandom() < 0.15,
    };
    if (Math.abs(star.x - moonX) > 8 || Math.abs(star.y - moonY) > 8) stars.push(star);
  }
  const allClouds = [...highClouds, ...clouds];

  const birds: Bird[] = [];
  // Low in the glow, under the hero text, where they can cross the sun.
  for (let i = 0; i < 3; i++) {
    birds.push({
      x: random() * W,
      y: horizon - 16 - Math.floor(random() * 12),
      speed: 3 + random() * 3,
      phase: random() * 10,
    });
  }

  const rays: Ray[] = [];
  const rayCount = Math.max(3, Math.round(W / 70));
  for (let i = 0; i < rayCount; i++) {
    rays.push({
      x: ((i + 0.5) * W) / rayCount + (random() - 0.5) * 20 + 25,
      width: 4 + Math.floor(random() * 7),
      depth: Math.round((waterBottom - horizon) * (0.45 + random() * 0.4)),
      alpha: 0.06 + random() * 0.05,
      phase: random() * 10,
    });
  }

  const kelp: Kelp[] = [];
  const addKelp = (x: number, back: boolean) => {
    if (x < 0 || x >= W) return;
    const base = ground[x];
    const room = base - horizon - 6;
    if (room < 12) return;
    kelp.push({
      x,
      base,
      back,
      height: Math.round(room * (back ? 0.45 + random() * 0.5 : 0.25 + random() * 0.6)),
      phase: random() * Math.PI * 2,
      speed: 0.7 + random() * 0.5,
      sway: 2 + random() * 3,
      gap: 4 + Math.floor(random() * 3),
    });
  };
  // Most kelp grows from the rocks, which is the whole point.
  for (const rock of rocks) {
    const count = 1 + Math.floor(random() * 3);
    for (let k = 0; k < count; k++) {
      addKelp(rock.cx + Math.round((random() - 0.5) * rock.rx * 1.2), random() < 0.35);
    }
  }
  for (let i = 0; i < Math.round(W / 16); i++) addKelp(Math.floor(random() * W), random() < 0.6);
  const backKelp = kelp.filter((k) => k.back);
  const frontKelp = kelp.filter((k) => !k.back);

  const schools: School[] = [];
  for (let i = 0; i < Math.max(3, Math.round(W / 70)); i++) {
    const members = [];
    const size = 3 + Math.floor(random() * 4);
    for (let m = 0; m < size; m++) {
      members.push({ dx: m * 7 + Math.floor(random() * 3), dy: Math.round((random() - 0.5) * 6), phase: random() * 6 });
    }
    schools.push({
      x: random() * W,
      y: horizon + 14 + Math.floor(random() * Math.max(1, waterBottom - horizon - 30)),
      dir: random() < 0.5 ? 1 : -1,
      speed: 3 + random() * 5,
      colors: FISH_COLORS[Math.floor(random() * FISH_COLORS.length)],
      members,
    });
  }

  const bubbles: Bubble[] = [];
  for (let i = 0; i < Math.round(W / 9); i++) {
    const near = kelp.length > 0 && random() < 0.6 ? kelp[Math.floor(random() * kelp.length)] : null;
    const x = near ? near.x + Math.round((random() - 0.5) * 4) : Math.floor(random() * W);
    const from = ground[clamp(x, 0, W - 1)] - 1;
    const speed = 5 + random() * 5;
    bubbles.push({
      x,
      from,
      speed,
      cycle: (from - horizon) / speed + random() * 3,
      offset: random() * 20,
      big: random() < 0.25,
    });
  }

  const crabHome = Math.round(W * 0.86);

  return (ctx, t) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(backdrop, 0, 0);

    for (const star of stars) {
      const s = Math.sin(t * star.speed + star.phase);
      if (s < -0.4) continue; // twinkled out for a moment
      dot(ctx, star.x, star.y, STAR.bright);
      if (star.big && s > 0.75) {
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) dot(ctx, star.x + dx, star.y + dy, STAR.glint);
      }
    }

    for (const cloud of allClouds) {
      const span = W + cloud.sprite.width * 2;
      ctx.drawImage(cloud.sprite, Math.round(wrap(cloud.x + cloud.speed * t, span) - cloud.sprite.width), cloud.y);
    }

    for (const bird of birds) {
      const x = Math.round(wrap(bird.x - bird.speed * t, W + 20) - 10);
      const y = bird.y + Math.round(Math.sin(t * 0.8 + bird.phase) * 2);
      const frame = Math.floor(t * 4 + bird.phase) % 2 === 0 ? BIRD_UP : BIRD_DOWN;
      drawSprite(ctx, frame, { b: BIRD }, x, y);
    }

    // Light coming down through the water, leaning away from the sun.
    let lastStyle = '';
    for (const ray of rays) {
      const x0 = ray.x + Math.sin(t * 0.15 + ray.phase) * 6;
      for (let r = 1; r < ray.depth; r++) {
        const a = (Math.ceil((1 - r / ray.depth) * 4) / 4) * ray.alpha; // stepped, not smooth
        const style = `rgba(255, 228, 196, ${a.toFixed(3)})`;
        if (style !== lastStyle) {
          ctx.fillStyle = style;
          lastStyle = style;
        }
        ctx.fillRect(Math.round(x0 - r * 0.38), horizon + r, ray.width, 1);
      }
    }

    // The sun's reflection, breaking up as it widens away from the horizon.
    const shimmer = Math.floor(t * 3);
    for (let r = 1; r <= 16; r++) {
      const spread = sunR * 0.7 + r * 1.6;
      for (let k = 0; k < 3; k++) {
        if (hash2(r * 7 + k, shimmer + k * 13) < 0.25) continue;
        const x = Math.round(sunX + (hash2(r, k * 31 + shimmer) - 0.5) * 2 * spread);
        const len = Math.max(1, 2 + Math.floor(hash2(k, r + shimmer) * 4) - Math.floor(r / 6));
        block(ctx, x, horizon + r, len, 1, r < 5 ? '#fde9cf' : '#f6caa2');
      }
    }
    // Small ripples across the whole surface.
    const ripple = Math.floor(t * 1.5);
    ctx.fillStyle = 'rgba(214, 236, 228, 0.35)';
    for (let r = 2; r <= 22; r += 2) {
      for (let k = 0; k < W / 24; k++) {
        if (hash2(r * 131 + k, ripple) < 0.5) continue;
        const x = Math.floor(hash2(k * 17 + r, ripple + 5) * W);
        ctx.fillRect(x, horizon + r, 2 + Math.floor(hash2(k, r) * 3), 1);
      }
    }

    const boatX = Math.round(W * 0.2 + Math.sin(t * 0.12) * 5);
    const bob = Math.round(Math.sin(t * 1.6));
    drawSprite(ctx, BOAT, BOAT_AT_DUSK, boatX, horizon - 7 + bob);
    block(ctx, boatX + 2, horizon + 4 + bob, 9, 1, 'rgba(142, 63, 30, 0.35)');

    for (const k of backKelp) drawKelp(ctx, k, t);

    for (const school of schools) {
      const span = W + 60;
      for (const m of school.members) {
        const x = Math.round(wrap(school.x + school.dir * school.speed * t + m.dx, span) - 30);
        const y = school.y + m.dy + Math.round(Math.sin(t * 1.5 + m.phase));
        drawSprite(ctx, FISH, school.colors, x, y, school.dir === -1);
      }
    }

    for (const k of frontKelp) drawKelp(ctx, k, t);

    for (const b of bubbles) {
      const y = Math.round(b.from - ((t + b.offset) % b.cycle) * b.speed);
      if (y < horizon + 2) continue; // popped, waiting to rise again
      const x = b.x + Math.round(Math.sin(t * 2 + b.offset));
      if (b.big) {
        block(ctx, x, y, 2, 2, BUBBLE.body);
        dot(ctx, x, y, BUBBLE.shine);
      } else {
        dot(ctx, x, y, BUBBLE.small);
      }
    }

    // A crab pottering back and forth.
    const crabX = clamp(crabHome + Math.round(Math.sin(t * 0.35) * 10), 0, W - 7);
    let crabGround = H;
    for (let x = crabX; x < crabX + 7; x++) crabGround = Math.min(crabGround, ground[x] ?? H);
    const walking = Math.abs(Math.cos(t * 0.35)) > 0.2;
    const crab = walking && Math.floor(t * 6) % 2 === 0 ? CRAB_B : CRAB_A;
    drawSprite(ctx, crab, CRAB_PALETTE, crabX, crabGround - 4);
  };
};

// One kelp stalk. The base never moves: the sway grows towards the tip.
function drawKelp(ctx: CanvasRenderingContext2D, k: Kelp, t: number): void {
  const color = k.back ? KELP_BACK : KELP_FRONT;
  let prevX = k.x;
  let x = k.x;
  for (let s = 0; s <= k.height; s++) {
    const f = s / k.height;
    const bend = Math.sin(t * k.speed + k.phase - s * 0.08) * k.sway * f ** 1.5 + CURRENT * f * f;
    x = Math.round(k.x + bend);
    const y = k.base - s;
    block(ctx, Math.min(x, prevX), y, Math.abs(x - prevX) + 1, 1, color.stem);
    prevX = x;

    if (s >= 4 && s % k.gap === 0) {
      const dir = (s / k.gap) % 2 === 0 ? 1 : -1;
      const len = 3 + ((s * 7 + k.gap) % 3);
      dot(ctx, x + dir, y, color.bulb);
      for (let i = 2; i <= len; i++) dot(ctx, x + dir * i, y - (i >> 1), color.blade);
      for (let i = 2; i < len; i++) dot(ctx, x + dir * i, y - (i >> 1) - 1, color.light);
    }
  }
  const top = k.base - k.height;
  dot(ctx, x - 1, top - 1, color.light);
  dot(ctx, x + 1, top - 1, color.light);
  dot(ctx, x, top - 2, color.blade);

  // The holdfast: little roots gripping the rock.
  block(ctx, k.x - 2, k.base, 5, 1, color.root);
  for (const dx of [-3, -1, 1, 3]) dot(ctx, k.x + dx, k.base + 1, color.root);
}

export function SeaScene({ className }: { className?: string }) {
  return <PixelCanvas prepare={prepareSea} pixelSize={seaPixelSize} fps={12} stillTime={6} className={className} />;
}
