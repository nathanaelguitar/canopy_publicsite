/**
 * OakBackground Canvas Renderer
 * Procedural warm oak wood plank renderer with cathedral grain arcs, seams, growth knots,
 * sun glow, and subtle ambient vignette matching the native CanopyChat iOS implementation.
 */

const OakPalettes = {
  light: {
    baseTop: '#F5EDE0',
    baseMid: '#EADDC6',
    baseBottom: '#D8C5A4',
    grain: '#3D2914',
    grainOpacity: 0.045,
    seam: '#6B4423',
    seamOpacity: 0.06,
    knot: '#6B4423',
    knotOpacity: 0.05,
    glow: '#D4A017',
    glowOpacity: 0.07,
    vignetteOpacity: 0.05
  },
  dark: {
    baseTop: '#201A14',
    baseMid: '#2C2318',
    baseBottom: '#3A2E1F',
    grain: '#D4B896',
    grainOpacity: 0.035,
    seam: '#D4B896',
    seamOpacity: 0.05,
    knot: '#D4B896',
    knotOpacity: 0.04,
    glow: '#D4A017',
    glowOpacity: 0.045,
    vignetteOpacity: 0.16
  }
};

function hexToRGBA(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class OakCanvasRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.theme = 'light';
    this.dpr = window.devicePixelRatio || 1;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    window.addEventListener('resize', this.resize);
    this.resize();
  }

  setTheme(theme) {
    this.theme = theme === 'dark' ? 'dark' : 'light';
    this.render();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.render();
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    const p = OakPalettes[this.theme] || OakPalettes.light;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, w, h);

    // 1. Base Warm Wood Linear Gradient
    const baseGrad = ctx.createLinearGradient(0, 0, w * 0.15, h);
    baseGrad.addColorStop(0, p.baseTop);
    baseGrad.addColorStop(0.5, p.baseMid);
    baseGrad.addColorStop(1, p.baseBottom);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Vertical Plank Seams
    const plankCount = 4;
    for (let i = 1; i < plankCount; i++) {
      const x = (w * i) / plankCount + Math.sin(i * 3.7) * 8;
      
      // Shadow seam
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x - 4, h * 0.35, x + 6, h * 0.7, x + 3, h);
      ctx.strokeStyle = hexToRGBA(p.seam, p.seamOpacity);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Highlight beside seam
      ctx.beginPath();
      ctx.moveTo(x + 1.6, 0);
      ctx.bezierCurveTo(x - 2.4, h * 0.35, x + 7.6, h * 0.7, x + 4.6, h);
      ctx.strokeStyle = hexToRGBA(p.baseTop, p.seamOpacity * 0.8);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 3. Long Vertical Grain Streaks inside each plank
    for (let i = 0; i < 14; i++) {
      const t = i / 13.0;
      const x = w * (0.04 + t * 0.92) + Math.sin(i * 12.9898) * 10;
      const sway = 6.0 + 8.0 * Math.abs(Math.sin(i * 4.31));
      const width = 0.8 + 0.9 * Math.abs(Math.sin(i * 7.7));

      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.bezierCurveTo(x + sway, h * 0.33, x - sway, h * 0.66, x + sway * 0.4, h + 10);
      ctx.strokeStyle = hexToRGBA(p.grain, p.grainOpacity);
      ctx.lineWidth = width;
      ctx.stroke();
    }

    // 4. Cathedral Grain Arcs (the tall arch figures in oak planks)
    const cathedrals = [
      { cx: 0.16, cy: 0.24, s: 1.0 },
      { cx: 0.62, cy: 0.52, s: 1.3 },
      { cx: 0.36, cy: 0.80, s: 0.9 }
    ];

    cathedrals.forEach(figure => {
      const cx = w * figure.cx;
      const cy = h * figure.cy;
      for (let ring = 0; ring < 4; ring++) {
        const rw = (26.0 + ring * 20.0) * figure.s;
        const rh = rw * 2.6;

        ctx.beginPath();
        ctx.moveTo(cx - rw, cy + rh);
        ctx.bezierCurveTo(cx - rw, cy - rh * 0.7, cx + rw, cy - rh * 0.7, cx + rw, cy + rh);
        ctx.strokeStyle = hexToRGBA(p.grain, p.grainOpacity * (1.0 - ring * 0.18));
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    });

    // 5. Knots with Growth Rings
    const knots = [
      { cx: 0.82, cy: 0.18, r: 9 },
      { cx: 0.12, cy: 0.62, r: 7 },
      { cx: 0.68, cy: 0.88, r: 8 }
    ];

    knots.forEach(knot => {
      const centerX = w * knot.cx;
      const centerY = h * knot.cy;

      // Knot Core
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, knot.r * 0.6, knot.r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = hexToRGBA(p.knot, p.knotOpacity * 2.2);
      ctx.fill();

      // Knot Rings
      for (let ring = 1; ring <= 3; ring++) {
        const rx = knot.r * (1.0 + ring * 1.1);
        const ry = rx * 0.72;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRGBA(p.knot, p.knotOpacity * (1.0 - ring * 0.22));
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    });

    // 6. Warm Afternoon Sun Glow (Upper Left)
    const glowTop = ctx.createRadialGradient(-w * 0.1, -h * 0.1, 10, -w * 0.1, -h * 0.1, Math.max(w, h) * 0.7);
    glowTop.addColorStop(0, hexToRGBA(p.glow, p.glowOpacity));
    glowTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowTop;
    ctx.fillRect(0, 0, w, h);

    // 7. Answering Golden Glow (Lower Right)
    const glowBottom = ctx.createRadialGradient(w * 0.85, h * 0.9, 10, w * 0.85, h * 0.9, Math.max(w, h) * 0.55);
    glowBottom.addColorStop(0, hexToRGBA(p.glow, p.glowOpacity * 0.8));
    glowBottom.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowBottom;
    ctx.fillRect(0, 0, w, h);

    // 8. Soft Vignette to keep focus on center content
    const minDim = Math.min(w, h);
    const maxDim = Math.max(w, h);
    const vignette = ctx.createRadialGradient(w / 2, h / 2, minDim * 0.45, w / 2, h / 2, maxDim * 0.85);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, hexToRGBA('#000000', p.vignetteOpacity));
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
  }
}
