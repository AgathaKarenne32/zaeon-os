"use client";
/**
 * QuantumLabModule — Quantum Physics Visualization Studio
 *
 * Panels:
 *  Left  → Prompt bar + experiment selector
 *  Center → Main visualization (wave function / Bloch sphere / energy levels)
 *  Right  → State readout (quantum numbers, formulas, expectation values)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Atom, Loader2, Sparkles, Send, X, ChevronRight,
  BarChart3, Layers, Activity, Zap, Info,
} from 'lucide-react';
import { renderWaveFunction, type WaveFnMode } from './renderers/waveFunction';
import type { EnergySystem } from './renderers/energyLevels';

// ─── Dynamic imports ──────────────────────────────────────────────────────────
const BlochSphere     = dynamic(() => import('./renderers/blochSphere'),    { ssr: false, loading: () => <div className="flex items-center justify-center h-64 text-slate-600 text-xs">Loading 3D…</div> });
const EnergyLevels    = dynamic(() => import('./renderers/energyLevels'),   { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
export type VizMode =
  | 'waveFunction'
  | 'blochSphere'
  | 'energyLevels'
  | 'doubleSlit'
  | 'quantumCircuit';

interface QuantumScene {
  vizMode:      VizMode;
  title:        string;
  description:  string;
  hint?:        string;
  // wave function params
  waveFnMode?:  WaveFnMode;
  n?:           number;
  m?:           number;
  k0?:          number;
  sigma0?:      number;
  // bloch
  theta?:       number;  // polar   (0..π)
  phi?:         number;  // azimuth (0..2π)
  blochLabel?:  string;
  // energy
  energySystem?: EnergySystem;
  nActive?:     number;
  nLevels?:     number;
  // formula to display
  formula?:     string;
  expectation?: string;
}

// ─── Quick presets ────────────────────────────────────────────────────────────
const PRESETS: Array<{ emoji: string; label: string; scene: QuantumScene }> = [
  {
    emoji: '📦', label: 'Particle in Box',
    scene: { vizMode:'waveFunction', waveFnMode:'squareWell', n:1, title:'Infinite Square Well (n=1)', description:'Ground state of a particle trapped between rigid walls. ψ₁(x) = √(2/L) sin(πx/L).', formula:'E_n = n²π²ℏ²/(2mL²)', hint:'Higher n → more nodes → higher energy. The ground state has no nodes.' },
  },
  {
    emoji: '🌊', label: 'Superposition',
    scene: { vizMode:'waveFunction', waveFnMode:'superposition', n:1, m:2, title:'Superposition |ψ⟩ = (|1⟩+|2⟩)/√2', description:'Equal superposition of first two eigenstates. The probability density ψ² oscillates at the beat frequency (E₂−E₁)/ℏ.', formula:'ψ = (ψ₁e^{-iE₁t} + ψ₂e^{-iE₂t})/√2', hint:'Watch |ψ|² oscillate — this is quantum beat frequency, a purely quantum interference effect.' },
  },
  {
    emoji: '💻', label: 'Qubit — |+⟩',
    scene: { vizMode:'blochSphere', theta: Math.PI/2, phi:0, blochLabel:'|+⟩ state', title:'Qubit: |+⟩ = (|0⟩+|1⟩)/√2', description:'The |+⟩ state lies on the equator of the Bloch sphere at φ=0. It is the equal superposition of |0⟩ and |1⟩ with equal measurement probabilities.', formula:'|+⟩ = (|0⟩ + |1⟩)/√2', hint:'On the Bloch sphere |0⟩ is north pole, |1⟩ is south pole. The equator = superposition states.' },
  },
  {
    emoji: '⚡', label: 'Hydrogen Levels',
    scene: { vizMode:'energyLevels', energySystem:'hydrogen', nActive:3, nLevels:6, title:'Hydrogen Atom Energy Levels', description:'Discrete energy levels predicted by Bohr / Schrödinger. Transition from n=3 to n=1 emits UV light (Lyman series, λ ≈ 103 nm).', formula:'E_n = −13.6/n² eV', hint:'The transition arrow shows photon emission. The emitted photon carries energy ΔE = E_n − E_1.' },
  },
  {
    emoji: '🌀', label: 'Wave Packet',
    scene: { vizMode:'waveFunction', waveFnMode:'gaussian', k0:8, sigma0:0.12, title:'Free Gaussian Wave Packet', description:'A localised particle described by a Gaussian envelope times a plane wave e^{ik₀x}. The packet spreads over time as Δx·Δp ≥ ℏ/2.', formula:'ψ(x,t) = A·exp(−(x−x₀)²/4σ²)·e^{i(k₀x−ωt)}', hint:'Notice the packet spreading — this is quantum dispersion. The group velocity = ℏk₀/m tracks the classical position.' },
  },
  {
    emoji: '〰️', label: 'Double Slit',
    scene: { vizMode:'doubleSlit', title:'Double-Slit Interference', description:'A single particle passes through two slits simultaneously. Bright fringes appear where path-length difference is a whole wavelength; dark fringes where it is a half wavelength.', formula:'I(θ) = I₀ cos²(πd sinθ/λ) sinc²(πa sinθ/λ)', hint:'Closing one slit destroys the interference pattern — the act of measuring "which slit" collapses the wave function.' },
  },
  {
    emoji: '⚛️', label: 'Harmonic Oscillator',
    scene: { vizMode:'waveFunction', waveFnMode:'harmonic', n:0, title:'Quantum Harmonic Oscillator (ground)', description:'The QHO is exactly solvable. Ground state n=0 has E₀ = ½ℏω (zero-point energy) — the particle is never at rest, even at absolute zero.', formula:'E_n = ℏω(n + ½)', hint:'The Gaussian envelope is the exact ground state. Higher n states have n nodes but the same Gaussian envelope shape.' },
  },
  {
    emoji: '🔮', label: 'H Radial Prob.',
    scene: { vizMode:'waveFunction', waveFnMode:'hydrogen', n:2, title:'Hydrogen Radial Probability P(r)', description:'Radial probability density P(r) = r²|R_n(r)|² for n=2. The most probable radius (peak) is the Bohr radius a₀ = 52.9 pm for n=1.', formula:'P(r) = r²|R_{n,ℓ}(r)|²', hint:'The Bohr radius corresponds to the peak probability. Classical mechanics would say the electron IS here, but quantum mechanics says it can be anywhere.' },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuantumLabModule() {
  const [scene, setScene]     = useState<QuantumScene>(PRESETS[0].scene);
  const [prompt, setPrompt]   = useState('');
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showInfo, setShowInfo]= useState(false);
  const [animate, setAnimate] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  const t0Ref     = useRef<number>(Date.now());

  // ─── Wave function animation loop ──────────────────────────────────────────
  useEffect(() => {
    if (
      !canvasRef.current ||
      (scene.vizMode !== 'waveFunction' && scene.vizMode !== 'doubleSlit')
    ) return;

    const tick = () => {
      const t = animate ? (Date.now() - t0Ref.current) / 1000 : 0;
      renderWaveFunction(canvasRef.current!, {
        mode:    scene.vizMode === 'doubleSlit' ? 'doubleSlit' : (scene.waveFnMode ?? 'squareWell'),
        n:       scene.n,
        m:       scene.m,
        k0:      scene.k0,
        sigma0:  scene.sigma0,
        animate,
      }, t);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [scene, animate]);

  // ─── AI prompt ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const q = prompt.trim();
    if (!q || loading) return;
    setLoading(true);
    setAiError(null);
    try {
      const res  = await fetch('/api/agentic/quantum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (data.scene) {
        t0Ref.current = Date.now(); // reset time
        setScene(data.scene);
        setPrompt('');
      } else {
        setAiError('Could not interpret that experiment. Try: "particle in a box n=3", "qubit superposition", "hydrogen n=4".');
      }
    } catch (e: any) {
      setAiError(e.message ?? 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [prompt, loading]);

  const applyPreset = (s: QuantumScene) => {
    t0Ref.current = Date.now();
    setScene(s);
    setAiError(null);
  };

  const needCanvas = scene.vizMode === 'waveFunction' || scene.vizMode === 'doubleSlit';

  return (
    <div className="w-full flex flex-col gap-0 rounded-[2rem] overflow-hidden border border-indigo-500/25
      bg-black/30 backdrop-blur-2xl shadow-2xl">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-900/40 border border-indigo-500/30">
            <Atom size={16} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-white">
              Quantum <span className="font-mono text-xs text-indigo-400">Lab</span>
            </h3>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold hidden sm:block">
              Physics Simulator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAnimate(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-widest transition-all ${animate ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-white/10 text-slate-500'}`}>
            {animate ? <Activity size={11} className="inline mr-1" /> : <Zap size={11} className="inline mr-1" />}
            {animate ? 'Live' : 'Static'}
          </button>
          <button onClick={() => setShowInfo(v => !v)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${showInfo ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-white/10 text-slate-500'}`}>
            <Info size={13} />
          </button>
        </div>
      </div>

      {/* ─── Preset chips ────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hidden border-b border-white/5">
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => applyPreset(p.scene)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold whitespace-nowrap transition-all border ${
              scene.title === p.scene.title
                ? 'bg-indigo-500/25 border-indigo-500/40 text-indigo-200'
                : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}>
            <span>{p.emoji}</span><span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Visualization ───────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ minHeight: 320 }}>
        {needCanvas && (
          <canvas
            ref={canvasRef}
            width={900} height={320}
            className="w-full"
            style={{ display: 'block', aspectRatio: '900/320' }}
          />
        )}
        {scene.vizMode === 'blochSphere' && (
          <BlochSphere
            state={{ theta: scene.theta ?? Math.PI/4, phi: scene.phi ?? 0, label: scene.blochLabel }}
            height={320}
          />
        )}
        {scene.vizMode === 'energyLevels' && (
          <div className="flex justify-center items-center py-4 bg-[#030014]">
            <EnergyLevels
              system={scene.energySystem ?? 'hydrogen'}
              nActive={scene.nActive ?? 1}
              nLevels={scene.nLevels ?? 6}
              width={500}
              height={300}
            />
          </div>
        )}

        {/* Experiment title badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/50 border border-white/10 backdrop-blur-sm">
          <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">{scene.title}</p>
        </div>
      </div>

      {/* ─── Info / Formula panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
            className="overflow-hidden border-t border-white/10">
            <div className="px-5 py-4 flex flex-col gap-2">
              <p className="text-[11px] text-slate-300 leading-relaxed">{scene.description}</p>
              {scene.formula && (
                <code className="text-[11px] font-mono bg-indigo-900/30 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-indigo-200">
                  {scene.formula}
                </code>
              )}
              {scene.hint && (
                <div className="px-3 py-2 rounded-lg bg-white/5 border border-indigo-500/15">
                  <p className="text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-400">Insight: </span>{scene.hint}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── AI Prompt ───────────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-white/10">
        {aiError && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <X size={12} className="text-red-400" />
            <p className="text-[10px] text-red-400">{aiError}</p>
          </div>
        )}
        <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/40">
          <Sparkles size={13} className="ml-1 text-indigo-400 shrink-0" />
          <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="Describe an experiment… 'electron in a harmonic trap n=3', 'qubit |+i⟩ state', 'hydrogen n=4 emission'"
            className="flex-1 bg-transparent text-xs outline-none text-slate-300 placeholder:text-slate-600 font-mono"
          />
          <button onClick={handleSubmit} disabled={loading || !prompt.trim()}
            className="px-3 py-1.5 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-40 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {loading ? 'Solving…' : 'Simulate'}
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-2 text-center tracking-wide">
          Powered by Schrödinger solver · Bloch sphere · Energy diagrams · Gemini AI
        </p>
      </div>
    </div>
  );
}
