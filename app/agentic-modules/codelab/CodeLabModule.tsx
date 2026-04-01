"use client";
/**
 * CodeLabModule — VS Code-powered coding environment
 *
 * Left panel  → Monaco editor (language selector, AI assist)
 * Right panel → Output console + Pyodide status + AI challenge
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Play, Trash2, Sparkles, Loader2,
  Terminal, CheckCircle2, XCircle, Info, Bot, Send, X,
} from 'lucide-react';
import { useCodeRunner, type Language } from './useCodeRunner';

// Monaco loads only client-side
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-slate-500 text-xs gap-2">
        <Loader2 size={14} className="animate-spin" /> Loading editor…
      </div>
    ),
  }
);

// ─── Language config ──────────────────────────────────────────────────────────
const LANGUAGES: Array<{ id: Language; label: string; emoji: string; monaco: string; starter: string }> = [
  {
    id: 'javascript', label: 'JavaScript', emoji: '🟨', monaco: 'javascript',
    starter: `// JavaScript Playground\n// console.log() output appears in the panel →\n\nconst fibonacci = (n) => {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n};\n\nfor (let i = 0; i < 10; i++) {\n  console.log(\`F(\${i}) = \${fibonacci(i)}\`);\n}\n`,
  },
  {
    id: 'typescript', label: 'TypeScript', emoji: '🔷', monaco: 'typescript',
    starter: `// TypeScript Playground\n// Type annotations are stripped before running\n\ninterface Vector {\n  x: number;\n  y: number;\n}\n\nconst dot = (a: Vector, b: Vector): number => a.x * b.x + a.y * b.y;\n\nconst v1: Vector = { x: 3, y: 4 };\nconst v2: Vector = { x: 1, y: 2 };\n\nconsole.log('Dot product:', dot(v1, v2));\nconsole.log('|v1| =', Math.sqrt(dot(v1, v1)));\n`,
  },
  {
    id: 'python', label: 'Python', emoji: '🐍', monaco: 'python',
    starter: `# Python Playground (Pyodide — real CPython in browser!)\n# Runs locally via WebAssembly — no server needed\n\ndef quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left   = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right  = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)\n\nnums = [3, 6, 8, 10, 1, 2, 1]\nprint("Original:", nums)\nprint("Sorted:  ", quicksort(nums))\n\n# Matrix multiply\nimport math\nprint(f"\\nsin(π/6) = {math.sin(math.pi/6):.6f}")\nprint(f"cos(π/3) = {math.cos(math.pi/3):.6f}")\n`,
  },
  {
    id: 'html', label: 'HTML/CSS', emoji: '🌐', monaco: 'html',
    starter: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white; }\n    .card { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 2rem 3rem; border-radius: 1rem; text-align: center; box-shadow: 0 20px 60px rgba(99,102,241,.4); }\n    h1 { margin: 0 0 0.5rem; font-size: 2rem; }\n    p  { margin: 0; opacity: .7; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>Zaeon OS 🚀</h1>\n    <p>HTML/CSS preview — edit and run!</p>\n  </div>\n</body>\n</html>`,
  },
];

const DEFAULT_LANG_ID: Language = 'javascript';

// ─── Component ────────────────────────────────────────────────────────────────
export default function CodeLabModule() {
  const [lang,    setLang]    = useState<Language>(DEFAULT_LANG_ID);
  const [code,    setCode]    = useState(LANGUAGES.find(l => l.id === DEFAULT_LANG_ID)!.starter);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt]  = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showAi,  setShowAi]  = useState(false);

  const { run, output, isRunning, isPyodideReady, pyodideError, clearOutput } = useCodeRunner();

  const currentLang = LANGUAGES.find(l => l.id === lang)!;

  // ─── Language switch ──────────────────────────────────────────────────────
  const handleLangSwitch = (newLang: Language) => {
    const cfg = LANGUAGES.find(l => l.id === newLang)!;
    setLang(newLang);
    setCode(cfg.starter);
    setHtmlPreview(null);
    clearOutput();
  };

  // ─── Run code ─────────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (lang === 'html') {
      setHtmlPreview(code);
      return;
    }
    await run(code, lang);
  }, [code, lang, run]);

  // ─── AI assist ───────────────────────────────────────────────────────────
  const handleAiAssist = useCallback(async () => {
    const q = aiPrompt.trim();
    if (!q || aiLoading) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/agentic/codelab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, code, language: lang }),
      });
      const data = await res.json();
      if (data.response) setAiResponse(data.response);
      if (data.updatedCode) setCode(data.updatedCode);
      setAiPrompt('');
    } catch (e: any) {
      setAiResponse(`Error: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, aiLoading, code, lang]);

  return (
    <div className="w-full flex flex-col gap-0 rounded-[2rem] overflow-hidden border border-cyan-500/25
      bg-black/30 backdrop-blur-2xl shadow-2xl">

      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-cyan-900/40 border border-cyan-500/30">
            <Code2 size={15} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-white">
              Code <span className="font-mono text-xs text-cyan-400">Lab</span>
            </h3>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
              {isPyodideReady ? '🐍 Python ready' : pyodideError ? '⚠️ Python unavailable' : '⏳ Loading Python…'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/30 rounded-xl border border-white/10">
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => handleLangSwitch(l.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${
                  lang === l.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}>
                <span>{l.emoji}</span><span className="hidden sm:inline">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Editor + Output (side by side on wide, stacked on narrow) ── */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: 380 }}>

        {/* Editor panel */}
        <div className="flex-1 flex flex-col border-r border-white/10 min-w-0 min-h-0" style={{ minHeight: 320 }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#1e1e1e]/80">
            <span className="text-[9px] font-mono text-slate-500">{currentLang.emoji} {currentLang.label}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAi(v => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] border transition-all ${
                  showAi ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'border-white/10 text-slate-500'
                }`}>
                <Bot size={10} /> AI
              </button>
              <button onClick={clearOutput}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] border border-white/10 text-slate-500 hover:text-white transition-all">
                <Trash2 size={10} /> Clear
              </button>
              <button onClick={handleRun} disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-bold border bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 transition-all disabled:opacity-50">
                {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                {lang === 'html' ? 'Preview' : 'Run'}
              </button>
            </div>
          </div>

          <div className="flex-1" style={{ minHeight: 280 }}>
            <MonacoEditor
              height="100%"
              defaultLanguage={currentLang.monaco}
              language={currentLang.monaco}
              value={code}
              onChange={v => setCode(v ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* AI Assist strip */}
          <AnimatePresence>
            {showAi && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                className="overflow-hidden border-t border-cyan-500/20 bg-cyan-950/20">
                <div className="p-3 flex flex-col gap-2">
                  {aiResponse && (
                    <div className="text-[10px] text-cyan-200 bg-cyan-900/20 border border-cyan-500/15 rounded-lg p-2 max-h-28 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {aiResponse}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-cyan-400 shrink-0" />
                    <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAiAssist(); }}
                      placeholder="Ask AI… 'explain this code', 'add error handling', 'optimise the loop'"
                      className="flex-1 bg-transparent text-[10px] text-slate-300 placeholder:text-slate-600 outline-none font-mono"
                    />
                    <button onClick={handleAiAssist} disabled={aiLoading || !aiPrompt.trim()}
                      className="px-2 py-1 rounded-lg text-[9px] font-bold bg-cyan-600 text-white disabled:opacity-40 hover:bg-cyan-500 transition-all">
                      {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Output / Preview panel */}
        <div className="w-full lg:w-80 flex flex-col bg-[#0a0014]/80 border-t lg:border-t-0 border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <Terminal size={11} className="text-cyan-400" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Output</span>
            {output.length > 0 && (
              <span className="ml-auto text-[8px] text-slate-600">{output.length} lines</span>
            )}
          </div>

          {lang === 'html' && htmlPreview ? (
            <iframe
              srcDoc={htmlPreview}
              className="flex-1 w-full border-none"
              sandbox="allow-scripts allow-same-origin"
              style={{ minHeight: 280 }}
              title="HTML Preview"
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed" style={{ minHeight: 280 }}>
              {output.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-700 text-xs flex-col gap-2">
                  <Play size={20} />
                  <span>Click Run to execute</span>
                </div>
              )}
              {output.map((line, i) => (
                <div key={i} className={`flex items-start gap-2 mb-1 ${
                  line.type === 'stderr'  ? 'text-red-400' :
                  line.type === 'info'    ? 'text-slate-500' :
                  line.type === 'result'  ? 'text-amber-300' :
                  'text-emerald-300'
                }`}>
                  {line.type === 'stderr'  && <XCircle     size={10} className="shrink-0 mt-0.5 text-red-400" />}
                  {line.type === 'stdout'  && <span className="shrink-0 w-2.5 text-[8px] text-emerald-600">&gt;</span>}
                  {line.type === 'info'    && <Info         size={10} className="shrink-0 mt-0.5 text-slate-600" />}
                  {line.type === 'result'  && <CheckCircle2 size={10} className="shrink-0 mt-0.5 text-amber-400" />}
                  <span className="whitespace-pre-wrap break-all">{line.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
        <p className="text-[9px] text-slate-600 tracking-wide">
          Monaco Editor · Pyodide (Python WASM) · JS Sandbox · Gemini AI
        </p>
        <div className="flex items-center gap-1.5">
          {isPyodideReady  && <span className="text-[8px] text-emerald-500 font-bold">🐍 Python ✓</span>}
          {!isPyodideReady && !pyodideError && <span className="text-[8px] text-amber-500">⏳ Loading Python…</span>}
          {pyodideError    && <span className="text-[8px] text-red-500">⚠️ Python offline</span>}
        </div>
      </div>
    </div>
  );
}
