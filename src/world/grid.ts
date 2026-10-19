export const INK = "#e8ecf4";
export const PAPER = "#0a0d18";

export const FONT_PX = 9;
export const FAMILY = "ui-monospace, Menlo, Consolas, monospace";
export const FONT = `bold ${FONT_PX}px ${FAMILY}`;

/**
 * The character grid. Cells are a whole number of device pixels so the GPU glyph pass (ascii.ts) stays
 * crisp. This class also draws overlay text (labels, Zs, hints) on its own transparent canvas.
 * Everything outside this file speaks in cells, not pixels.
 */
export class Grid {
  cols = 0;
  rows = 0;
  dpr = 1;
  /** Cell size in CSS pixels (a whole number of device pixels). */
  cellW = 0;
  cellH = 0;
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const { width, height } = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    // Resizing the canvas resets its context state, so the font goes back on after.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.font = FONT;
    this.ctx.textBaseline = "top";
    this.cellW = Math.round(this.ctx.measureText("M").width * this.dpr) / this.dpr;
    this.cellH = Math.round(FONT_PX * 1.2 * this.dpr) / this.dpr;
    this.cols = Math.floor(width / this.cellW);
    this.rows = Math.floor(height / this.cellH);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Draw text starting at a cell. Spaces are transparent; anything off-grid is skipped. */
  put(col: number, row: number, text: string, color = INK) {
    col = Math.round(col);
    row = Math.round(row);
    if (row < 0 || row >= this.rows) return;
    this.ctx.fillStyle = color;
    for (let i = 0; i < text.length; i++) {
      const x = col + i;
      if (text[i] !== " " && x >= 0 && x < this.cols) {
        this.ctx.fillText(text[i], x * this.cellW, row * this.cellH);
      }
    }
  }

  /** Draw rows of art with its top-left at a cell. Each row hides whatever is under its non-space span. */
  art(col: number, row: number, lines: string[], color = INK) {
    lines.forEach((line, i) => {
      const start = line.search(/\S/);
      if (start < 0) return;
      this.blank(col + start, row + i, line.trimEnd().length - start);
      this.put(col, row + i, line, color);
    });
  }

  /** Paint cells with the night paper, hiding the world beneath. */
  blank(col: number, row: number, length: number) {
    this.ctx.fillStyle = PAPER;
    this.ctx.fillRect(Math.round(col) * this.cellW, Math.round(row) * this.cellH, length * this.cellW, this.cellH);
  }

  /** Larger bold text centred on a cell, for things that must read instantly (Zs, alerts). */
  big(col: number, row: number, text: string, color: string, scale: number) {
    this.ctx.font = `bold ${FONT_PX * scale}px ${FAMILY}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, col * this.cellW, row * this.cellH);
    this.ctx.textAlign = "start";
    this.ctx.font = FONT;
  }
}
