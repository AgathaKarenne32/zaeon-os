"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked, X, Trash2, Clock, ChevronRight,
  FolderOpen, Loader2, RefreshCw, Save
} from 'lucide-react';
import type { SceneDescriptor } from './types';

// ─── Types (mirrors API) ──────────────────────────────────────────────────────

export interface SavedSession {
  id:             string;
  title:          string;
  prompt?:        string;
  courseRoom:     string;
  sceneDescriptor: SceneDescriptor;
  renderHistory:  SceneDescriptor[];
  voxelCount:     number;
  annotations:    { id: string; text: string; color: string; sceneTitle: string; createdAt: string }[];
  createdAt:      string;
  updatedAt:      string;
}

// ─── Room emoji map ───────────────────────────────────────────────────────────
const ROOM_EMOJI: Record<string, string> = {
  bio:        '🌿',
  med:        '🔬',
  quantic:    '⚛️',
  cyber:      '💻',
  humanities: '📚',
};

// ─── Render-mode icon map ─────────────────────────────────────────────────────
const MODE_EMOJI: Record<string, string> = {
  dna:      '🧬', rna: '🔬', molecule: '⚗️', crystal: '🔷',
  cell:     '🔴', plant: '🌱', fungus: '🍄', animal: '🐎',
  quantum:  '⚛️', atom: '💡', math: '📈', protein: '🧪',
};

// ─── Time relative helper ─────────────────────────────────────────────────────
function timeAgo(isoDate: string): string {
  const delta = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(delta / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SessionManagerProps {
  currentSessionId: string | null;
  onLoadSession:    (session: SavedSession) => void;
  onSaveRequest:    () => void;
  isSaving:         boolean;
  accentColor?:     string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SessionManager({
  currentSessionId,
  onLoadSession,
  onSaveRequest,
  isSaving,
  accentColor = '#22d3ee',
}: SessionManagerProps) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [sessions,  setSessions]  = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/agentic/biosim/sessions');
      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch {
      setError('Could not load sessions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when opening
  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen, fetchSessions]);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(sessionId);
    try {
      await fetch(`/api/agentic/biosim/sessions?id=${sessionId}`, { method: 'DELETE' });
      setSessions(s => s.filter(x => x.id !== sessionId));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      {/* ─── Trigger button ───────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        title="Saved Sessions"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold
          uppercase tracking-widest border transition-all whitespace-nowrap
          ${isOpen
            ? 'bg-white/15 border-white/30 text-white'
            : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white bg-white/5'
          }`}
      >
        <BookMarked size={12} />
        <span>Sessions</span>
        {sessions.length > 0 && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300">
            {sessions.length}
          </span>
        )}
      </button>

      {/* ─── Session drawer (slides from right side of module) ────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-0 right-0 bottom-0 z-50 w-80 flex flex-col
                rounded-r-[2rem] rounded-l-3xl border border-white/15
                bg-[#0c0c1a]/97 backdrop-blur-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <BookMarked size={15} style={{ color: accentColor }} />
                  <span className="text-sm font-black text-white">Research Sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchSessions}
                    disabled={isLoading}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Save current button */}
              <div className="px-4 py-3 border-b border-white/5 shrink-0">
                <button
                  onClick={() => { onSaveRequest(); }}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                    text-white text-[10px] font-black uppercase tracking-widest transition-all
                    disabled:opacity-50 hover:brightness-110"
                  style={{ background: `linear-gradient(135deg, ${accentColor}66, ${accentColor})` }}
                >
                  {isSaving
                    ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
                    : <><Save size={12} /> Save Current Scene</>
                  }
                </button>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 scrollbar-hidden">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 size={20} className="animate-spin text-slate-500" />
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest">
                      Loading sessions…
                    </span>
                  </div>
                )}

                {!isLoading && error && (
                  <div className="text-center py-8">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                {!isLoading && !error && sessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <FolderOpen size={32} className="text-slate-700" />
                    <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                      No saved sessions yet.<br />
                      Click &quot;Save Current Scene&quot; to begin.
                    </p>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {sessions.map(session => {
                    const isCurrent = session.id === currentSessionId;
                    const modeEmoji = MODE_EMOJI[(session.sceneDescriptor as any)?.renderMode ?? ''] ?? '🔬';
                    const roomEmoji = ROOM_EMOJI[session.courseRoom] ?? '📚';

                    return (
                      <motion.button
                        key={session.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => { onLoadSession(session); setIsOpen(false); }}
                        className={`group/session w-full text-left flex flex-col gap-2 p-4 rounded-2xl
                          border transition-all ${
                          isCurrent
                            ? 'border-white/30 bg-white/10'
                            : 'border-white/8 bg-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base leading-none">{modeEmoji}</span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-white truncate">
                                {session.title}
                              </p>
                              {session.prompt && (
                                <p className="text-[9px] text-slate-500 truncate mt-0.5">
                                  &quot;{session.prompt}&quot;
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={e => handleDelete(session.id, e)}
                              disabled={deleting === session.id}
                              className="opacity-0 group-hover/session:opacity-100 transition-opacity
                                w-6 h-6 rounded flex items-center justify-center
                                text-red-400 hover:text-red-300"
                            >
                              {deleting === session.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <Trash2 size={11} />
                              }
                            </button>
                            <ChevronRight size={13} className="text-slate-600 group-hover/session:text-slate-300 transition-colors" />
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 text-[9px] text-slate-600">
                          <span>{roomEmoji} {session.courseRoom}</span>
                          <span>·</span>
                          <span>{session.voxelCount.toLocaleString()} voxels</span>
                          <span>·</span>
                          <span>{session.annotations.length} notes</span>
                          <span className="ml-auto flex items-center gap-1">
                            <Clock size={9} />
                            {timeAgo(session.updatedAt)}
                          </span>
                        </div>

                        {/* Render history breadcrumb */}
                        {session.renderHistory.length > 1 && (
                          <div className="flex items-center gap-1 overflow-hidden">
                            {session.renderHistory.slice(-4).map((s: any, i, arr) => (
                              <span key={i} className="flex items-center gap-1">
                                <span className="text-[8px] text-slate-600 truncate max-w-[60px]">
                                  {MODE_EMOJI[s.renderMode] ?? '🔬'} {s.title?.split(' ')[0]}
                                </span>
                                {i < arr.length - 1 && (
                                  <ChevronRight size={8} className="text-slate-700 shrink-0" />
                                )}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Current badge */}
                        {isCurrent && (
                          <span
                            className="self-start text-[8px] font-black uppercase tracking-widest
                              px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                          >
                            Active
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/10 shrink-0">
                <p className="text-[8px] text-slate-700 text-center tracking-wider">
                  Sessions auto-save on every render · Max 50 sessions stored
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
