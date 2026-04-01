"use client";
/**
 * useCodeRunner — Manages code execution environments
 *
 * Supports:
 *  - JavaScript/TypeScript → sandboxed iframe + postMessage
 *  - Python              → Pyodide (WASM CPython from CDN, singleton)
 *
 * Returns:
 *  { run, output, isRunning, isPyodideReady, clearOutput }
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RunOutput {
  type:    'stdout' | 'stderr' | 'info' | 'result';
  text:    string;
  ts:      number;
}

export type Language = 'javascript' | 'typescript' | 'python' | 'html' | 'other';

// ─── Pyodide singleton ────────────────────────────────────────────────────────
let pyodidePromise: Promise<any> | null = null;

async function getPyodide(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (!pyodidePromise) {
    pyodidePromise = new Promise((resolve, reject) => {
      // Load Pyodide script from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
      script.async = true;
      script.onload = async () => {
        try {
          const py = await (window as any).loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/',
          });
          resolve(py);
        } catch (e) { reject(e); }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return pyodidePromise;
}

// ─── JS sandbox template ──────────────────────────────────────────────────────
function buildSandboxHTML(code: string): string {
  // TypeScript → strip basic type annotations (simplistic, good enough for sandbox)
  const jsCode = code
    .replace(/:\s*(string|number|boolean|void|any|null|undefined|never)\b/g, '')
    .replace(/<[A-Z][^>]*>/g, '') // remove generic type params
    .replace(/^(interface|type)\s+\w+[^{]*\{[^}]*\}\s*$/gm, '');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
  const _logs = [];
  const _oLog = console.log.bind(console);
  const _oErr = console.error.bind(console);
  console.log = (...args) => {
    const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    window.parent.postMessage({ type: 'stdout', text }, '*');
    _oLog(...args);
  };
  console.error = (...args) => {
    const text = args.map(a => String(a)).join(' ');
    window.parent.postMessage({ type: 'stderr', text }, '*');
    _oErr(...args);
  };
  window.onerror = (msg, src, line, col, err) => {
    window.parent.postMessage({ type: 'stderr', text: \`\${msg} (line \${line})\` }, '*');
    return true;
  };
  try {
    const __result = (function() {
      ${jsCode}
    })();
    if (__result !== undefined) {
      window.parent.postMessage({ type: 'result', text: JSON.stringify(__result, null, 2) }, '*');
    }
    window.parent.postMessage({ type: 'done' }, '*');
  } catch(e) {
    window.parent.postMessage({ type: 'stderr', text: e.message }, '*');
    window.parent.postMessage({ type: 'done' }, '*');
  }
<\/script>
</body>
</html>`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useCodeRunner() {
  const [output,         setOutput]         = useState<RunOutput[]>([]);
  const [isRunning,      setIsRunning]      = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [pyodideError,   setPyodideError]   = useState<string | null>(null);
  const pyRef   = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // ─── Pre-load Pyodide on mount ────────────────────────────────────────────
  useEffect(() => {
    getPyodide()
      .then(py => { pyRef.current = py; setIsPyodideReady(true); })
      .catch(e  => { setPyodideError(e.message ?? 'Pyodide failed to load'); });
  }, []);

  const clearOutput = useCallback(() => setOutput([]), []);

  const push = useCallback((type: RunOutput['type'], text: string) => {
    setOutput(prev => [...prev, { type, text, ts: Date.now() }]);
  }, []);

  // ─── Run code ─────────────────────────────────────────────────────────────
  const run = useCallback(async (code: string, lang: Language) => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput([]);
    push('info', `▶ Running ${lang}…`);

    try {
      // ── Python via Pyodide ───────────────────────────────────────────────
      if (lang === 'python') {
        if (!isPyodideReady || !pyRef.current) {
          push('stderr', pyodideError ?? 'Python runtime not ready yet. Please wait…');
          setIsRunning(false);
          return;
        }
        const py = pyRef.current;
        // Capture stdout via StringIO
        py.runPython(`
import sys, io
_stdout_buf = io.StringIO()
_stderr_buf = io.StringIO()
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf
        `);
        try {
          py.runPython(code);
          const stdout = py.runPython('_stdout_buf.getvalue()');
          const stderr = py.runPython('_stderr_buf.getvalue()');
          if (stdout) push('stdout', stdout);
          if (stderr) push('stderr', stderr);
        } catch (e: any) {
          push('stderr', String(e));
        } finally {
          py.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__');
        }
        push('info', '✓ Done');
        setIsRunning(false);
        return;
      }

      // ── HTML preview ─────────────────────────────────────────────────────
      if (lang === 'html') {
        push('info', 'HTML preview opened in panel below ↓');
        setIsRunning(false);
        return;
      }

      // ── JS / TS via sandboxed iframe ─────────────────────────────────────
      if (lang === 'javascript' || lang === 'typescript') {
        const html  = buildSandboxHTML(code);
        const blob  = new Blob([html], { type: 'text/html' });
        const url   = URL.createObjectURL(blob);

        // Create / reuse iframe
        let iframe = iframeRef.current;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.sandbox.add('allow-scripts');
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
          iframeRef.current = iframe;
        }

        const cleanup = () => { URL.revokeObjectURL(url); };

        const msgPromise = new Promise<void>(resolve => {
          const handler = (ev: MessageEvent) => {
            if (ev.source !== iframe?.contentWindow) return;
            const { type, text } = ev.data ?? {};
            if (type === 'done') {
              window.removeEventListener('message', handler);
              cleanup();
              resolve();
            } else if (type && text !== undefined) {
              push(type as RunOutput['type'], text);
            }
          };
          window.addEventListener('message', handler);
          // Timeout safety
          setTimeout(() => { window.removeEventListener('message', handler); resolve(); }, 8000);
        });

        iframe.src = url;
        await msgPromise;
        push('info', '✓ Done');
        setIsRunning(false);
        return;
      }

      // ── Other languages ───────────────────────────────────────────────────
      push('info', `🚧 ${lang} execution is not yet supported in-browser.`);
      push('info', 'Coming soon: Rust, Go, SQL via self-hosted Piston.');
    } catch (e: any) {
      push('stderr', e.message ?? 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, isPyodideReady, pyodideError, push]);

  return { run, output, isRunning, isPyodideReady, pyodideError, clearOutput, iframeRef };
}
