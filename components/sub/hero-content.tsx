"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// Componentes Internos
import MenuNavigation from "@/components/sub/MenuNavigation";
import GameHint from "@/src/components/ui/game-hint";

export default function HeroPage() {
  const { t } = useTranslation();

  // Estado que controla se o highlight já foi descartado
  const [showHighlight, setShowHighlight] = useState(true);

  // Estados para controlar o Scroll e visibilidade
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(0);

  // Lógica de Scroll (Esconde ao descer, mostra ao subir)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShow(false);
      } else {
        setShow(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Transição suave
  const transition = { duration: 1.5, ease: [0.23, 1, 0.32, 1] };

  return (
    <main className="w-full min-h-screen flex justify-start items-start relative px-4 md:pl-20 py-12 overflow-hidden bg-white dark:bg-[#05080a] transition-colors duration-700">

      {/* CONTEÚDO PRINCIPAL (TRAVADO EM 420px) */}
      <div className="flex flex-col items-start z-20 w-full max-w-[420px]">

        <motion.div
          className="w-full"
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: show ? 0 : "-100%", opacity: show ? 1 : 0 }}
          transition={transition}
        >
          <AnimatePresence mode="wait">
            {showHighlight ? (
              /* ─── HIGHLIGHT DE BOAS-VINDAS COM GLITCH ─── */
              <motion.div
                key="highlight"
                className="w-full mt-24 rounded-[32px] overflow-hidden backdrop-blur-2xl bg-cyan-950/10 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.4 } }}
                transition={{ duration: 0.6 }}
              >
                <div className="px-8 py-12 md:py-16 flex flex-col items-start gap-6 min-h-[320px] justify-center relative overflow-hidden">

                  {/* Ambient scan line */}
                  <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

                  {/* Tagline */}
                  <motion.span
                    className="text-[10px] uppercase tracking-[0.35em] text-cyan-400/80 font-bold z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    ZAEON OS
                  </motion.span>

                  {/* Mensagem principal com glitch */}
                  <motion.div
                    className="z-10"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  >
                    <h1
                      className="highlight-glitch text-[22px] sm:text-2xl md:text-[28px] font-light text-slate-800 dark:text-white/90 leading-[1.5] tracking-tight"
                      style={{ fontFamily: 'var(--font-outfit), system-ui, -apple-system, sans-serif' }}
                      data-text="O Sistema Operacional de Quem Ensina, Aprende, Pesquisa e Entrega."
                    >
                      O Sistema Operacional de Quem Ensina, Aprende, Pesquisa e Entrega.
                    </h1>
                  </motion.div>

                  {/* Subtle separator */}
                  <motion.div
                    className="w-12 h-[1px] bg-gradient-to-r from-cyan-400/60 to-transparent z-10"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    style={{ transformOrigin: 'left' }}
                  />

                  {/* Botão Iniciar */}
                  <motion.button
                    onClick={() => setShowHighlight(false)}
                    className="group relative overflow-hidden flex items-center justify-center rounded-2xl px-6 min-h-[44px] transition-all duration-300 cursor-pointer font-medium text-slate-800 dark:text-white bg-black/5 dark:bg-white/[0.03] hover:bg-black/10 dark:hover:bg-white/[0.08] border border-black/10 dark:border-white/5 hover:border-cyan-400/50 dark:hover:border-cyan-400/30 text-xs tracking-[0.15em] uppercase z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-cyan-400 opacity-0 scale-y-0 group-hover:opacity-100 group-hover:scale-y-100 transition-all duration-500" />
                    <span className="pl-2 group-hover:text-cyan-400 transition-colors">Iniciar</span>
                  </motion.button>

                </div>
              </motion.div>
            ) : (
              /* ─── MENU NAVIGATION ORIGINAL ─── */
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <MenuNavigation />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Game Hints — só aparece depois do highlight sumir */}
        {!showHighlight && (
          <motion.div
            className="mt-4 w-full"
            initial={{ x: "-120%", opacity: 0 }}
            animate={{ x: show ? 0 : "-120%", opacity: show ? 1 : 0 }}
            transition={{ ...transition, delay: 0.1 }}
          >
            <GameHint
              isVisible={show}
              hints={[
                t("hints.new_game", "DICA: Inicie com um perfil novo para conferir a tecnologia."),
                t("hints.save_progress", "DICA: Conecte sua conta Google para salvar progresso."),
                t("hints.roles", "DICA: Cada classe libera ferramentas exclusivas.")
              ]}
            />
          </motion.div>
        )}
      </div>

      {/* CSS do Glitch embutido para não depender do styled-jsx */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .highlight-glitch {
          position: relative;
        }
        .highlight-glitch::before,
        .highlight-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .highlight-glitch::before {
          left: 1px;
          text-shadow: -1px 0 rgba(0, 255, 249, 0.25);
          animation: highlight-glitch-1 8s infinite linear alternate-reverse;
          clip-path: inset(0 0 0 0);
        }
        .highlight-glitch::after {
          left: -1px;
          text-shadow: 1px 0 rgba(255, 0, 193, 0.25);
          animation: highlight-glitch-2 6s infinite linear alternate-reverse;
          clip-path: inset(0 0 0 0);
        }

        @keyframes highlight-glitch-1 {
          0%   { clip-path: inset(85% 0 5% 0); }
          5%   { clip-path: inset(15% 0 65% 0); transform: translate(-0.5px, 0); }
          10%  { clip-path: inset(0 0 100% 0); }
          15%  { clip-path: inset(60% 0 15% 0); }
          20%  { clip-path: inset(5% 0 80% 0); transform: translate(0.5px, 0); }
          30%  { clip-path: inset(0 0 100% 0); }
          40%  { clip-path: inset(45% 0 40% 0); }
          45%  { clip-path: inset(90% 0 2% 0); transform: translate(0); }
          55%  { clip-path: inset(0 0 100% 0); }
          60%  { clip-path: inset(25% 0 55% 0); transform: translate(-0.5px, 0); }
          70%  { clip-path: inset(0 0 100% 0); }
          80%  { clip-path: inset(10% 0 75% 0); transform: translate(0.5px, 0); }
          85%  { clip-path: inset(0 0 100% 0); }
          90%  { clip-path: inset(50% 0 30% 0); }
          95%  { clip-path: inset(0 0 100% 0); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(0); }
        }

        @keyframes highlight-glitch-2 {
          0%   { clip-path: inset(10% 0 70% 0); }
          8%   { clip-path: inset(50% 0 25% 0); transform: translate(0.5px, 0); }
          15%  { clip-path: inset(0 0 100% 0); }
          25%  { clip-path: inset(80% 0 5% 0); }
          30%  { clip-path: inset(20% 0 60% 0); transform: translate(-0.5px, 0); }
          40%  { clip-path: inset(0 0 100% 0); }
          50%  { clip-path: inset(65% 0 20% 0); }
          55%  { clip-path: inset(5% 0 85% 0); transform: translate(0); }
          65%  { clip-path: inset(0 0 100% 0); }
          75%  { clip-path: inset(40% 0 40% 0); transform: translate(0.5px, 0); }
          80%  { clip-path: inset(0 0 100% 0); }
          90%  { clip-path: inset(15% 0 65% 0); }
          95%  { clip-path: inset(75% 0 10% 0); transform: translate(-0.5px, 0); }
          100% { clip-path: inset(55% 0 30% 0); transform: translate(0); }
        }
        `
      }} />
    </main>
  );
}