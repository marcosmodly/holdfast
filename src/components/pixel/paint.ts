// Helpers shared by the pixel-art scenes on the landing page. Scenes draw at
// "art" resolution, one canvas pixel per art pixel, and CSS scales the canvas
// up with `image-rendering: pixelated`, so every art pixel stays a crisp square.

export type Rgb = readonly [number, number, number];

export function rgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** Wraps a position into [0, span), for things that drift off one edge and back in the other. */
export function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

// mulberry32: small, fast, and plenty for placing rocks and fish. A fixed seed
// means a scene looks the same on every visit.
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same inputs, same output in [0, 1). Used for flicker that should look
// random but must not need any state carried between frames.
export function hash2(a: number, b: number): number {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// 4x4 Bayer matrix, the classic ordered-dither pattern.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** True on roughly `amount` (0..1) of pixels, in a regular cross-hatch pattern. */
export function dither(x: number, y: number, amount: number): boolean {
  return amount > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
}

/**
 * The colour at position f (0..1) through a list of flat bands. Neighbouring
 * bands meet in a dithered seam instead of a smooth gradient; `seam` is how
 * much of the distance between two band centres the seam takes up.
 */
export function bandColor(bands: readonly Rgb[], f: number, x: number, y: number, seam = 0.5): Rgb {
  const pos = clamp(f, 0, 1) * bands.length - 0.5;
  const i = Math.floor(pos);
  if (i < 0) return bands[0];
  if (i >= bands.length - 1) return bands[bands.length - 1];
  const amount = (pos - i - (0.5 - seam / 2)) / seam;
  return dither(x, y, amount) ? bands[i + 1] : bands[i];
}

/** An ImageData painted pixel by pixel, for backdrops that are drawn once per resize. */
export class PixelBuffer {
  readonly image: ImageData;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.image = new ImageData(width, height);
  }

  set(x: number, y: number, color: Rgb): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = ((y | 0) * this.width + (x | 0)) * 4;
    this.image.data[i] = color[0];
    this.image.data[i + 1] = color[1];
    this.image.data[i + 2] = color[2];
    this.image.data[i + 3] = 255;
  }

  toCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.getContext('2d')?.putImageData(this.image, 0, 0);
    return canvas;
  }
}

export type Palette = Readonly<Record<string, string>>;

/**
 * Draws a sprite written as rows of characters, so the art can be read in
 * the source. '.' is transparent; any other character is a palette key.
 * `flip` mirrors it left to right.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  palette: Palette,
  x: number,
  y: number,
  flip = false,
): void {
  const width = rows[0].length;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const color = palette[row[c]];
      if (color === undefined) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + (flip ? width - 1 - c : c), y + r, 1, 1);
    }
  }
}

/**
 * drawSprite, with only `amount` (0..1) of its pixels drawn, in a dither
 * pattern. Pixel art's way of fading something in or out.
 */
export function drawSpriteFaded(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  palette: Palette,
  x: number,
  y: number,
  amount: number,
): void {
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const color = palette[rows[r][c]];
      if (color === undefined || !dither(x + c, y + r, amount)) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
}

/** A rectangle with its four corner pixels cut off. */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  block(ctx, x + 1, y, w - 2, h, color);
  block(ctx, x, y + 1, w, h - 2, color);
}

/** A white card with a one-pixel border, like the cards on the page. */
export function paperCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  roundRect(ctx, x, y, w, h, '#e3d8ca');
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, '#fffdfb');
}

/** A one-pixel dot. */
export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/** A filled rectangle in art pixels. */
export function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
