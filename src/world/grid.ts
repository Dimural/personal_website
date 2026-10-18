export const INK = "#111";

const FONT_PX = 12;
const LINE_PX = FONT_PX * 1.2;
const FONT = `${FONT_PX}px ui-monospace, Menlo, Consolas, monospace`;

/** A monospace character grid over a canvas. Everything outside this file speaks in cells, not pixels. */
export class Grid {
  cols = 0;
  rows = 0;
  private ctx: CanvasRenderingContext2D;
  private cellW = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    // Resizing the canvas resets its context state, so the font goes back on after.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.font = FONT;
    this.ctx.textBaseline = "top";
    this.cellW = this.ctx.measureText("M").width;
    this.cols = Math.floor(width / this.cellW);
    this.rows = Math.floor(height / LINE_PX);
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
        this.ctx.fillText(text[i], x * this.cellW, row * LINE_PX);
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

  /** Paint cells back to the page background. */
  blank(col: number, row: number, length: number) {
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(Math.round(col) * this.cellW, Math.round(row) * LINE_PX, length * this.cellW, LINE_PX);
  }
}
