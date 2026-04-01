/**
 * Wave Function Canvas Renderer
 *
 * Solves and animates quantum wave functions on a 2D canvas.
 * Supports:
 *   - Infinite square well (particle in a box)
 *   - Harmonic oscillator ground state
 *   - Free Gaussian wave packet (spreading)
 *   - Hydrogen radial probability
 *   - Double-slit interference pattern
 *   - Superposition of two states
 */

export type WaveFnMode =
  | 'squareWell'
  | 'harmonic'
  | 'gaussian'
  | 'hydrogen'
  | 'superposition'
  | 'doubleSlit';

export interface WaveFnOptions {
  mode:      WaveFnMode;
  n?:        number;   // principal quantum number (default 1)
  m?:        number;   // second mode for superposition (default 2)
  k0?:       number;   // initial momentum for Gaussian (default 5)
  sigma0?:   number;   // initial spread for Gaussian (default 0.15)
  animate?:  boolean;  // whether to tick in time
}

// ─── Physical constants (ℏ=m=1 units) ────────────────────────────────────────
const HBAR = 1;
const MASS = 1;
const L    = 1;   // well width / domain

// ─── Infinite square well ψ_n(x) ─────────────────────────────────────────────
function squareWellPsi(x: number, n: number): number {
  return Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L);
}
function squareWellE(n: number): number {
  return (n * n * Math.PI * Math.PI * HBAR * HBAR) / (2 * MASS * L * L);
}

// ─── Harmonic oscillator: ground state |0⟩ ───────────────────────────────────
function harmonicPsi(x: number, n: number): number {
  const w = 50;    // scaled omega
  const alpha = Math.sqrt(MASS * w / HBAR);
  const xi = alpha * (x - 0.5) * 4;
  // H_n(xi) for n = 0..3 only
  const H = [ 1, 2*xi, 4*xi*xi-2, 8*xi*xi*xi-12*xi ];
  const hn = H[Math.min(n, 3)];
  const norm = Math.pow(2, -n / 2) / Math.sqrt(factorial(n));
  return norm * hn * Math.exp(-xi * xi / 2) * 2.5;
}
function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

// ─── Free Gaussian wave packet ────────────────────────────────────────────────
function gaussianPsi(x: number, t: number, k0: number, sigma0: number): [number, number] {
  const x0 = 0.35; // initial centre
  const sigma_t = sigma0 * Math.sqrt(1 + (t * HBAR) / (2 * MASS * sigma0 * sigma0));
  const xc = x0 + (HBAR * k0 / MASS) * t; // classical trajectory
  const dx = x - xc;
  const env = Math.exp(-(dx * dx) / (4 * sigma_t * sigma_t)) / Math.sqrt(2.5066 * sigma_t);
  const phaseMove  = k0 * x - (HBAR * k0 * k0 / (2 * MASS)) * t;
  const phaseExtra = -(dx * dx * HBAR * t) / (4 * MASS * sigma_t * sigma_t * sigma0 * sigma0);
  const phi = phaseMove + phaseExtra;
  return [env * Math.cos(phi), env * Math.sin(phi)]; // [Re, Im]
}

// ─── Double-slit interference intensity ──────────────────────────────────────
function doubleSlitIntensity(x: number): number {
  const d  = 0.2;  // slit separation
  const a  = 0.03; // slit width
  const lambda = 0.05; // wavelength
  const theta  = (x - 0.5) * 2;
  const beta   = (Math.PI * a  * theta) / lambda;
  const delta  = (Math.PI * d  * theta) / lambda;
  const sinc   = beta === 0 ? 1 : Math.sin(beta) / beta;
  return sinc * sinc * Math.cos(delta) * Math.cos(delta);
}

// ─── Main render function ─────────────────────────────────────────────────────
export function renderWaveFunction(
  canvas: HTMLCanvasElement,
  opts: WaveFnOptions,
  t: number
): void {
  const ctx   = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#030014');
  bg.addColorStop(1, '#0a0028');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 10; gx++) {
    const px = (gx / 10) * W;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
  }
  for (let gy = 0; gy <= 8; gy++) {
    const py = (gy / 8) * H;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
  }

  // x-axis
  const axisY = H * 0.65;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(W, axisY); ctx.stroke();

  const STEPS = W;
  const n  = opts.n  ?? 1;
  const m  = opts.m  ?? 2;
  const k0 = opts.k0 ?? 5;
  const s0 = opts.sigma0 ?? 0.15;
  const AMP = H * 0.28;

  // Helper to draw a waveform line
  const drawLine = (vals: number[], color: string, lw = 1.5) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    vals.forEach((v, i) => {
      const px = (i / STEPS) * W;
      const py = axisY - v * AMP;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
  };

  // Helper to fill probability density
  const fillDensity = (densities: number[], color: string) => {
    ctx.beginPath();
    densities.forEach((d, i) => {
      const px = (i / STEPS) * W;
      const py = axisY - d * AMP;
      i === 0 ? ctx.moveTo(px, axisY) : void 0;
      ctx.lineTo(px, py);
    });
    ctx.lineTo(W, axisY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  if (opts.mode === 'doubleSlit') {
    const intensity = Array.from({ length: STEPS }, (_, i) => {
      const x = i / STEPS;
      return doubleSlitIntensity(x);
    });
    const maxI = Math.max(...intensity);
    const normed = intensity.map(v => v / maxI);

    // Filled pattern (cyan glow)
    fillDensity(normed, 'rgba(34,211,238,0.25)');
    drawLine(normed, '#22d3ee', 2);

    // Bright fringe markers
    normed.forEach((v, i) => {
      if (v > 0.9) {
        const px = (i / STEPS) * W;
        const py = axisY - v * AMP;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    });
    return;
  }

  // Compute ψ values
  const psiRe: number[] = [];
  const psiIm: number[] = [];
  const prob:  number[] = [];

  for (let i = 0; i <= STEPS; i++) {
    const x = i / STEPS;
    let re = 0, im = 0;

    if (opts.mode === 'squareWell') {
      const E_n = squareWellE(n);
      re = squareWellPsi(x, n) * Math.cos(-E_n * t);
      im = squareWellPsi(x, n) * Math.sin(-E_n * t);
    } else if (opts.mode === 'harmonic') {
      const w  = 50;
      const En = HBAR * w * (n + 0.5);
      re = harmonicPsi(x, n) * Math.cos(-En * t * 0.01);
      im = harmonicPsi(x, n) * Math.sin(-En * t * 0.01);
    } else if (opts.mode === 'gaussian') {
      [re, im] = gaussianPsi(x, t * 0.005, k0, s0);
    } else if (opts.mode === 'superposition') {
      const E1 = squareWellE(n);
      const E2 = squareWellE(m);
      const psi1 = squareWellPsi(x, n);
      const psi2 = squareWellPsi(x, m);
      re = (psi1 * Math.cos(-E1 * t) + psi2 * Math.cos(-E2 * t)) / Math.SQRT2;
      im = (psi1 * Math.sin(-E1 * t) + psi2 * Math.sin(-E2 * t)) / Math.SQRT2;
    } else if (opts.mode === 'hydrogen') {
      // Radial probability P(r) = r² |R_n1(r)|² — simplified 1D projection
      const r = x * 20; // 0..20 Bohr radii
      const a0 = 1;
      let rho = re = im = 0;
      if (n === 1) { const c = 2*Math.exp(-r/a0); rho = c*c*r*r; }
      else if (n === 2) { const c = (2-r/(2*a0))*Math.exp(-r/(2*a0))/Math.sqrt(8); rho = c*c*r*r; }
      else { const c = Math.exp(-r/(3*a0)); rho = c*c*r*r*0.02; }
      re = Math.sqrt(rho) * 0.3;
    }

    psiRe.push(re);
    psiIm.push(im);
    prob.push(re * re + im * im);
  }

  const maxProb = Math.max(...prob, 0.001);
  const normProb = prob.map(v => v / maxProb * 0.9);

  // |ψ|² probability density (filled)
  fillDensity(normProb, 'rgba(139,92,246,0.20)');

  // Re(ψ) — cyan
  drawLine(psiRe, '#22d3ee', 2);
  // Im(ψ) — pink
  if (opts.mode !== 'hydrogen') drawLine(psiIm, 'rgba(244,114,182,0.7)', 1.5);
  // |ψ|² — violet
  drawLine(normProb, '#a78bfa', 2);

  // Legend
  ctx.font = 'bold 10px monospace';
  const legend = [
    { color: '#22d3ee',  label: 'Re(ψ)' },
    { color: '#f472b6',  label: 'Im(ψ)' },
    { color: '#a78bfa',  label: '|ψ|²' },
  ];
  legend.forEach(({ color, label }, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(10, 12 + i * 16, 14, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(label, 30, 18 + i * 16);
  });
}
