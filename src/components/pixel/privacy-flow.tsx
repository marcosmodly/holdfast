'use client';

import { PixelCanvas, type PrepareScene } from './pixel-canvas';
import { block, clamp, dot, drawSprite, paperCard, roundRect } from './paint';

// "Where your voice note goes", acted out on a 100 x 24 art-pixel stage:
// the voice note goes into the transcriber and comes out as a text card,
// which gets a lock; the audio itself is thrown in the bin. One loop is
// LOOP seconds:
//
//   0.0  the voice note appears
//   1.4  it slides into the machine
//   2.2  the machine works
//   3.4  a text card slides out the other side
//   4.2  the audio flies into the bin
//   5.2  the text card is locked

const STAGE_W = 100;
const STAGE_H = 24;
const LOOP = 7.5;

const ACCENT = '#b4552d';
const CREAM = '#fbf7f2';
const TEXT = '#d3c5b3';
const ARROW = '#d2c3af';
const MACHINE = { body: '#3f7a7e', top: '#5a9496', screen: '#1d3e49', legs: '#2b545e', light: '#e6b54d' };
const BIN = { body: '#a3abae', line: '#8b9396', lid: '#7c8588' };
const LOCK = ['.kkk.', '.k.k.', 'ggggg', 'gg.gg', 'ggggg'];
const LOCK_COLORS = { k: '#8a8f99', g: '#e6b54d' };

function voiceNote(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  roundRect(ctx, x, y, 14, 9, ACCENT);
  block(ctx, x + 2, y + 9, 2, 1, ACCENT);
  dot(ctx, x + 1, y + 10, ACCENT);
  for (let i = 0; i < 4; i++) {
    const half = 1 + Math.round(Math.abs(Math.sin(t * 4 + i)) * 2);
    block(ctx, x + 3 + i * 2 + (i > 1 ? 1 : 0), y + 4 - half, 1, half * 2 + 1, CREAM);
  }
}

const preparePrivacy: PrepareScene = ({ width, height }) => {
  const ox = Math.floor((width - STAGE_W) / 2);
  const oy = Math.floor((height - STAGE_H) / 2);
  const mx = ox + 30; // machine
  const my = oy + 3;
  const binX = ox + 84;
  const binY = oy + 12;

  return (ctx, t) => {
    ctx.clearRect(0, 0, width, height);
    const p = t % LOOP;
    const ending = p >= LOOP - 0.5; // everything but the machine and bin clears away

    // Faint dotted arrows, so the steps read as a flow even between moves.
    for (const [from, to] of [[ox + 20, ox + 27], [mx + 20, mx + 25], [ox + 74, ox + 81]]) {
      for (let x = from; x < to; x += 2) dot(ctx, x, oy + 12, ARROW);
      dot(ctx, to - 1, oy + 11, ARROW);
      dot(ctx, to - 1, oy + 13, ARROW);
    }

    // The voice note pops in, waits, then slides into the machine. It is
    // drawn first so the machine hides it as it goes in.
    if (p < 2.2) {
      const lift = p < 0.3 ? 1 : 0;
      const slide = clamp((p - 1.4) / 0.8, 0, 1);
      voiceNote(ctx, Math.round(ox + 4 + slide * 24), oy + 8 - lift, t);
    }

    // The text card slides out from behind the machine and stays.
    if (p >= 3.4 && !ending) {
      const slide = clamp((p - 3.4) / 0.8, 0, 1);
      const cx = Math.round(mx + 2 + slide * 24);
      paperCard(ctx, cx, oy + 7, 16, 12);
      block(ctx, cx + 3, oy + 10, 10, 1, TEXT);
      block(ctx, cx + 3, oy + 13, 8, 1, TEXT);
      block(ctx, cx + 3, oy + 16, 6, 1, TEXT);
      if (p >= 5.2) drawSprite(ctx, LOCK, LOCK_COLORS, cx + 12, oy + 3 - (p < 5.35 ? 1 : 0));
    }

    // The machine: a screen that scrolls while it works, and a light.
    const working = p >= 2.2 && p < 3.6;
    roundRect(ctx, mx, my, 18, 16, MACHINE.body);
    block(ctx, mx + 1, my, 16, 2, MACHINE.top);
    block(ctx, mx + 3, my + 4, 12, 6, MACHINE.screen);
    if (working) {
      for (let row = 0; row < 3; row++) {
        const len = 3 + ((row + Math.floor(t * 8)) % 3) * 2;
        block(ctx, mx + 4, my + 5 + row * 2, len, 1, '#86ada3');
      }
    }
    dot(ctx, mx + 15, my + 12, working && Math.floor(t * 8) % 2 === 0 ? MACHINE.light : '#2b545e');
    block(ctx, mx, my + 11, 1, 4, MACHINE.screen);
    block(ctx, mx + 17, my + 11, 1, 4, MACHINE.screen);
    block(ctx, mx + 3, my + 16, 2, 2, MACHINE.legs);
    block(ctx, mx + 13, my + 16, 2, 2, MACHINE.legs);

    // The bin, whose lid pops open to take the audio.
    const lidOpen = p >= 4.0 && p < 5.1;
    block(ctx, binX, binY, 9, 9, BIN.body);
    for (const dx of [2, 4, 6]) block(ctx, binX + dx, binY + 2, 1, 6, BIN.line);
    block(ctx, binX - 1, lidOpen ? binY - 5 : binY - 2, 11, 2, BIN.lid);
    block(ctx, binX + 4, lidOpen ? binY - 6 : binY - 3, 3, 1, BIN.lid);

    // The audio, a scrap of the voice note, arcs over the card into the bin.
    if (p >= 4.2 && p < 5.0) {
      const k = (p - 4.2) / 0.8;
      const x = Math.round(mx + 18 + (binX + 2 - (mx + 18)) * k);
      const y = Math.round(my + 2 + (binY - 3 - (my + 2)) * k - Math.sin(k * Math.PI) * 4);
      roundRect(ctx, x, y, 5, 4, ACCENT);
      dot(ctx, x + 1, y + 1, CREAM);
      dot(ctx, x + 3, y + 1, CREAM);
      dot(ctx, x + 2, y + 2, CREAM);
    }
    if (p >= 5.0 && p < 5.4) {
      for (const [dx, dy] of [[-1, -4], [4, -6], [9, -4], [2, -8], [7, -8]]) {
        dot(ctx, binX + dx, binY + dy, '#c9c3cf');
      }
    }
  };
};

function privacyPixelSize(boxWidth: number): number {
  return Math.max(2, Math.floor(boxWidth / STAGE_W));
}

export function PrivacyFlow({ className }: { className?: string }) {
  return <PixelCanvas prepare={preparePrivacy} pixelSize={privacyPixelSize} fps={12} stillTime={6} className={className} />;
}
