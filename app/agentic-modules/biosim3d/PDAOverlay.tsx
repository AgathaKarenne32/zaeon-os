"use client";

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookPen, X, Plus, Trash2, ChevronDown, ChevronUp,
  Save, Loader2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Annotation {
  id:         string;
  text:       string;
  color:      string;
  sceneTitle: string;
  createdAt:  string;
}

interface PDAOverlayProps {
  sessionId:    string | null;
  sceneTitle:   string;
  annotations:  Annotation[];
  onAddNote:    (text: string, color: string) => Promise<void>;
  onDeleteNote: (annotationId: string) => Promise<void>;
  accentColor?: string;
}

// ─── Color palette for annotations ───────────────────────────────────────────

const NOTE_COLORS = [
  { hex: '#fbbf24', label: 'Amber'   },
  { hex: '#34d399', label: 'Emerald' },
  { hex: '#60a5fa', label: 'Blue'    },
  { hex: '#f472b6', label: 'Pink'    },
  { hex: '#a78bfa', label: 'Violet'  },
  { hex: '#f87171', label: 'Red'     },
  { hex: '#94a3b8', label: 'Slate'   },
  { hex: '#ffffff', label: 'White'   },
];

// ─── Single annotation card ───────────────────────────────────────────────────

function NoteCard({
  note,
  onDelete,
}: {
  note: Annotation;
  onDelete: (id: string) => void;
}) {
  const time = new Date(note.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="group/note relative flex gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
    >
      {/* Color stripe */}
      <div
        className="w-1 rounded-full shrink-0 mt-0.5"
        style={{ backgroundColor: note.color, minHeight: '100%' }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-200 leading-relaxed break-words">{note.text}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[9px] text-slate-600 font-mono">{time}</span>
          <span className="text-[8px] text-slate-700 truncate max-w-[100px]">
            @ {note.sceneTitle}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(note.id)}
        className="opacity-0 group-hover/note:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center text-red-400 hover:text-red-300 shrink-0 mt-0.5"
        title="Delete note"
      >
        <Trash2 size={11} />
      </button>
    </motion.div>
  );
}

// ─── Main PDA component ───────────────────────────────────────────────────────

export default function PDAOverlay({
  sessionId,
  sceneTitle,
  annotations,
  onAddNote,
  onDeleteNote,
  accentColor = '#22d3ee',
}: PDAOverlayProps) {
  const [isOpen,      setIsOpen]      = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText,   setInputText]   = useState('');
  const [activeColor, setActiveColor] = useState(NOTE_COLORS[0].hex);
  const [isSaving,    setIsSaving]    = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  const handleAdd = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSaving) return;

    if (!sessionId) {
      setSaveError('Save the session first to add notes.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await onAddNote(text, activeColor);
      setInputText('');
    } catch {
      setSaveError('Could not save note. Check connection.');
    } finally {
      setIsSaving(false);
    }
  }, [inputText, activeColor, isSaving, sessionId, onAddNote]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <>
      {/* ─── Trigger button (always visible on canvas overlay) ─────────────── */}
      <button
        onClick={() => { setIsOpen(o => !o); setIsMinimized(false); }}
        title="Open PDA — Personal Digital Annotations"
        className={`absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl
          border transition-all backdrop-blur-md text-[10px] font-bold uppercase tracking-widest
          ${isOpen
            ? 'bg-white/15 border-white/30 text-white'
            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
      >
        <NotebookPen size={12} />
        <span>PDA</span>
        {annotations.length > 0 && (
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
            style={{ backgroundColor: accentColor }}
          >
            {annotations.length}
          </span>
        )}
      </button>

      {/* ─── PDA Panel ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="absolute top-12 left-3 z-40 w-72 rounded-2xl border border-white/15
              bg-[#0c0c1a]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <NotebookPen size={14} style={{ color: accentColor }} />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">
                  PDA Notes
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(m => !m)}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  {isMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {/* Current scene indicator */}
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">
                      Active scene
                    </p>
                    <p className="text-[11px] text-slate-300 font-medium truncate">{sceneTitle}</p>
                    {!sessionId && (
                      <p className="text-[9px] text-amber-400 mt-1">
                        ⚠ Scene not saved yet — save first to persist notes
                      </p>
                    )}
                  </div>

                  {/* Notes list */}
                  <div className="px-3 pb-2 flex flex-col gap-1.5 max-h-52 overflow-y-auto scrollbar-hidden">
                    <AnimatePresence mode="popLayout">
                      {annotations.length === 0 ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[10px] text-slate-600 italic text-center py-4"
                        >
                          No notes yet. Add one below.
                        </motion.p>
                      ) : (
                        annotations.map(note => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onDelete={onDeleteNote}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10 mx-3" />

                  {/* Input area */}
                  <div className="p-3 flex flex-col gap-2">
                    {/* Color picker */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">
                        Tag color
                      </span>
                      <div className="flex gap-1 ml-auto">
                        {NOTE_COLORS.map(c => (
                          <button
                            key={c.hex}
                            onClick={() => setActiveColor(c.hex)}
                            title={c.label}
                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                              activeColor === c.hex
                                ? 'border-white scale-125'
                                : 'border-transparent hover:scale-110'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Add a note about this structure… (Ctrl+Enter to save)"
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2
                        text-[11px] text-slate-200 placeholder:text-slate-600 resize-none
                        focus:outline-none focus:border-white/25 transition-colors"
                    />

                    {/* Error */}
                    {saveError && (
                      <p className="text-[9px] text-red-400">{saveError}</p>
                    )}

                    {/* Add button */}
                    <button
                      onClick={handleAdd}
                      disabled={!inputText.trim() || isSaving}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl
                        text-white text-[10px] font-bold uppercase tracking-widest transition-all
                        disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}88, ${accentColor})`,
                      }}
                    >
                      {isSaving
                        ? <><Loader2 size={11} className="animate-spin" /> Saving…</>
                        : <><Plus size={11} /> Add Note</>
                      }
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
