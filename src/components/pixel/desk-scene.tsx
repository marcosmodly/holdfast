'use client';

import { PixelCanvas, type PaintFrame, type PixelSize } from './pixel-canvas';
import {
  bandColor,
  block,
  dither,
  dot,
  drawSprite,
  drawSpriteFaded,
  PixelBuffer,
  rgb,
  roundRect,
} from './paint';
import { BUST, HEART, HEART_COLORS, YOU } from './sprites';

// "Forgetting isn't the same as not caring." You at your desk, a friend on
// your mind, until the thought drifts away. Then the phone buzzes with a
// Holdfast nudge and the friend comes back to mind. One loop is LOOP seconds:
//
//   0.0  the friend is in the thought bubble
//   2.5  the friend fades away, leaving "..."
//   4.5  the phone buzzes and lights up
//   5.7  the friend fades back in, and a heart floats up

const LOOP = 9;

const WALL = ['#f4e8d9', '#f0e2d0', '#ebdac6'].map(rgb);
const WALL_DOT = rgb('#e6d3bd');
const WINDOW_SKY = ['#9eb0e2', '#c2c5e2', '#e6d1d3', '#f2c6a8', '#e9a37e'].map(rgb);
const WOOD = { top: rgb('#c4966a'), edge: rgb('#a87a52'), front: rgb('#8a6243'), dark: rgb('#6b4a32') };
const CURTAIN = { body: rgb('#c8643a'), fold: rgb('#a8552f') };
const BUBBLE = { edge: '#d8c7b4', fill: '#fffdfb' };

const FRIEND_FACE = [
  '..hhhh..',
  '.hhhhhh.',
  'hhsssshh',
  'hsessesh',
  'hssssssh',
  'hssmmssh',
  '.ssssss.',
  '..ssss..',
];
const FRIEND = { h: '#a8552f', s: '#c98f6a', e: '#2a2320', m: '#8e3f1e' };

const MUG = ['MMMM.', 'mmmmh', 'mmmmh', 'mmmm.'];
const MUG_COLORS = { M: '#e8915f', m: '#c8643a', h: '#c8643a' };

const LAMP = [
  '..SSS....',
  '.SSSSS...',
  'SSSSSSSa.',
  '.LLLLL.a.',
  '.......a.',
  '......a..',
  '......a..',
  '.....a...',
  '.....a...',
  '.....a...',
  '.....a...',
  '.....a...',
  '...bbbbb.',
];
const LAMP_COLORS = { S: '#e6b54d', L: '#fff1c1', a: '#4a4545', b: '#4a4545' };

const PLANT = [
  '..g.g...',
  '.gGg.g..',
  'gGgggGg.',
  '.gggGgg.',
  '..gGg...',
  '.ttttt..',
  '.ttttt..',
  '..ttt...',
];
const PLANT_COLORS = { g: '#56704a', G: '#7a9a5a', t: '#b4552d' };

// A warm pool of lamplight, painted once and stamped every frame.
function makeGlow(radius: number): HTMLCanvasElement {
  const size = radius * 2 + 1;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const alphas = [0, 0.07, 0.13, 0.2];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - radius, (y - radius) * 1.8) / radius;
      if (d >= 1) continue;
      const level = (1 - d) * (alphas.length - 1);
      let i = Math.floor(level);
      if (dither(x, y, level - i)) i += 1;
      if (i > 0) dot(ctx, x, y, `rgba(255, 200, 120, ${alphas[Math.min(i, alphas.length - 1)]})`);
    }
  }
  return canvas;
}

const prepareDesk = ({ width: W, height: H }: PixelSize): PaintFrame => {
  const deskY = H - 15;

  // The room: wallpaper and a window with the evening outside.
  const wall = new PixelBuffer(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const pattern = x % 6 === 3 && y % 6 === (Math.floor(x / 6) % 2) * 3;
      wall.set(x, y, pattern ? WALL_DOT : bandColor(WALL, y / H, x, y, 0.2));
    }
  }
  const win = { x: 6, y: 5, w: 22, h: 18 };
  for (let y = win.y; y < win.y + win.h; y++) {
    for (let x = win.x; x < win.x + win.w; x++) {
      const frame = x === win.x || x === win.x + win.w - 1 || y === win.y || y === win.y + win.h - 1;
      const mullion = x === win.x + 11 || y === win.y + 9;
      wall.set(x, y, frame || mullion ? WOOD.front : bandColor(WINDOW_SKY, (y - win.y) / win.h, x, y));
    }
  }
  for (let x = win.x - 1; x <= win.x + win.w; x++) {
    wall.set(x, win.y + win.h, WOOD.top);
    wall.set(x, win.y + win.h + 1, WOOD.edge);
  }
  for (let y = win.y - 2; y < win.y + win.h + 3; y++) {
    for (let x = win.x - 4; x < win.x - 1; x++) wall.set(x, y, x === win.x - 3 ? CURTAIN.fold : CURTAIN.body);
  }
  const room = wall.toCanvas();

  // The desk is drawn in front of you, so it is its own layer.
  const desk = new PixelBuffer(W, H);
  for (let y = deskY; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y === deskY) desk.set(x, y, WOOD.top);
      else if (y === deskY + 1) desk.set(x, y, WOOD.edge);
      else desk.set(x, y, WOOD.front);
    }
  }
  const drawerX = Math.round(W * 0.58);
  for (let x = drawerX; x < drawerX + 18; x++) {
    desk.set(x, deskY + 5, WOOD.dark);
    desk.set(x, deskY + 11, WOOD.dark);
  }
  for (let y = deskY + 5; y <= deskY + 11; y++) {
    desk.set(drawerX, y, WOOD.dark);
    desk.set(drawerX + 17, y, WOOD.dark);
  }
  desk.set(drawerX + 8, deskY + 8, rgb('#e6b54d'));
  desk.set(drawerX + 9, deskY + 8, rgb('#e6b54d'));
  const deskLayer = desk.toCanvas();

  const px = Math.round(W * 0.4) - 7;
  const py = deskY - 17; // high enough that the laptop stops at your chin
  const bx = px + 15; // thought bubble
  const by = py - 17;
  const lampX = W - 26;
  const phoneX = px + 20;
  const mugX = px - 9;
  const glow = makeGlow(16);

  return (ctx, t) => {
    const p = t % LOOP;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(room, 0, 0);
    // Two stars come out in the window.
    if (Math.sin(t * 1.3) > -0.3) dot(ctx, win.x + 4, win.y + 3, '#ffffff');
    if (Math.sin(t * 1.7 + 2) > -0.3) dot(ctx, win.x + 16, win.y + 5, '#ffffff');

    drawSprite(ctx, BUST, YOU, px, py);
    if (t % 3.7 < 0.15) {
      dot(ctx, px + 4, py + 5, YOU.s);
      dot(ctx, px + 9, py + 5, YOU.s);
    }
    // Lamplight on the wall, under the desk layer so it stays off the drawers.
    ctx.drawImage(glow, lampX + 3 - 16, deskY - 6 - 16);
    ctx.drawImage(deskLayer, 0, 0);

    // The back of your laptop, with a Holdfast sticker.
    block(ctx, px - 1, deskY - 7, 16, 7, '#cfc9d6');
    block(ctx, px - 1, deskY - 7, 16, 1, '#e2dde8');
    block(ctx, px + 14, deskY - 6, 1, 6, '#b5aec0');
    block(ctx, px - 2, deskY - 1, 18, 1, '#9e97aa');
    roundRect(ctx, px + 5, deskY - 5, 4, 3, '#b4552d');

    drawSprite(ctx, MUG, MUG_COLORS, mugX, deskY - 4);
    for (let k = 0; k < 2; k++) {
      const rise = (t * 3 + k * 3) % 6;
      dot(ctx, mugX + 1 + k * 2 + Math.round(Math.sin(t * 3 + k)), Math.round(deskY - 6 - rise), 'rgba(255, 255, 255, 0.8)');
    }

    // The phone: dark, then buzzing and lit with a nudge.
    const buzzing = p >= 4.5 && p < 5.7;
    const lit = p >= 4.5 && p < 7.5;
    const jitter = buzzing ? (Math.floor(t * 20) % 2 === 0 ? -1 : 1) : 0;
    block(ctx, phoneX + jitter, deskY - 2, 7, 1, lit ? '#e8875a' : '#3a3550');
    block(ctx, phoneX + jitter, deskY - 1, 7, 1, '#2a2320');
    if (buzzing) {
      dot(ctx, phoneX - 2, deskY - 3, '#8e3f1e');
      dot(ctx, phoneX + 8, deskY - 3, '#8e3f1e');
      dot(ctx, phoneX - 3, deskY - 4, '#8e3f1e');
      dot(ctx, phoneX + 9, deskY - 4, '#8e3f1e');
    }
    if (lit) {
      // The nudge itself, as a tiny voice-note bubble over the phone.
      roundRect(ctx, phoneX + 1, deskY - 8, 6, 4, '#b4552d');
      dot(ctx, phoneX + 2, deskY - 4, '#b4552d');
      dot(ctx, phoneX + 2, deskY - 6, '#fbf7f2');
      dot(ctx, phoneX + 4, deskY - 6, '#fbf7f2');
    }

    drawSprite(ctx, LAMP, LAMP_COLORS, lampX, deskY - 13);
    drawSprite(ctx, PLANT, PLANT_COLORS, W - 12, deskY - 8);

    // The thought bubble, with its trail of little puffs.
    block(ctx, px + 12, py - 1, 2, 2, BUBBLE.edge);
    roundRect(ctx, px + 13, py - 6, 5, 4, BUBBLE.edge);
    block(ctx, px + 14, py - 5, 3, 2, BUBBLE.fill);
    roundRect(ctx, bx, by + 2, 22, 11, BUBBLE.edge);
    roundRect(ctx, bx + 3, by, 8, 4, BUBBLE.edge);
    roundRect(ctx, bx + 12, by + 1, 7, 3, BUBBLE.edge);
    roundRect(ctx, bx + 1, by + 3, 20, 9, BUBBLE.fill);
    roundRect(ctx, bx + 4, by + 1, 6, 3, BUBBLE.fill);
    roundRect(ctx, bx + 13, by + 2, 5, 2, BUBBLE.fill);

    let face = 1;
    if (p >= 2.5 && p < 3.5) face = 1 - (p - 2.5);
    else if (p >= 3.5 && p < 5.7) face = 0;
    else if (p >= 5.7 && p < 6.5) face = (p - 5.7) / 0.8;
    if (face > 0) {
      drawSpriteFaded(ctx, FRIEND_FACE, FRIEND, bx + 7, by + 4, face);
    } else {
      const dots = Math.floor(p * 2) % 4;
      for (let d = 0; d < dots; d++) dot(ctx, bx + 8 + d * 3, by + 8, '#b9ab9a');
    }

    if (p >= 6.3 && p < 8.3) {
      drawSprite(ctx, HEART, HEART_COLORS, bx + 16, Math.round(by - 1 - (p - 6.3) * 5));
    }
  };
};

function deskPixelSize(boxWidth: number): number {
  return Math.max(3, Math.round(boxWidth / 88));
}

export function DeskScene({ className }: { className?: string }) {
  return <PixelCanvas prepare={prepareDesk} pixelSize={deskPixelSize} fps={12} stillTime={7} className={className} />;
}
