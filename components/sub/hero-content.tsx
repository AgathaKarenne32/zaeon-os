"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { signIn, useSession } from "next-auth/react";
import { SparklesIcon, UserIcon } from "@heroicons/react/24/outline";

// Componentes Internos
import MenuNavigation from "@/components/sub/MenuNavigation";

export default function HeroPage() {
  const { t } = useTranslation();
  const { status } = useSession();

  const [showChatbox, setShowChatbox] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setShowChatbox(true);
    }
  }, [status]);

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center relative px-4 py-12 overflow-hidden bg-slate-50 dark:bg-[#030508] transition-colors duration-700 font-sans">

      {/* BACKGROUND ESTILO GRID TECNOLÓGICO CIANO */}
      <div className="absolute inset-0 z-0">
        {/* Grid Sutil Adaptativo */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Orbs de Neon Exclusivamente Ciano/Azul */}
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/20 dark:bg-cyan-600/20 blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[150px] mix-blend-screen pointer-events-none" />
      </div>

      {/* ========================================= */}
      {/* HIGHLIGHT (HERO) - MINIMALISTA & GLITCH   */}
      {/* ========================================= */}
      <motion.div
        animate={{
          scale: showChatbox ? 0.75 : 1,
          y: showChatbox ? -60 : 0,
          opacity: showChatbox ? 0.4 : 1,
        }}
        transition={{ type: "spring", stiffness: 90, damping: 20 }}
        className="flex flex-col items-center text-center max-w-4xl z-10 w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <h1
            className="text-4xl sm:text-5xl md:text-[5rem] font-light tracking-tighter text-slate-900 dark:text-white leading-[1.1] z-10 relative"
          >
            Agentes autônomos para <br className="hidden md:block" />
            <span
              className="font-black text-cyan-600 dark:text-cyan-400 cyber-glitch relative inline-block mt-2 md:mt-4"
              data-text="mentes produtivas."
            >
              mentes produtivas.
            </span>
          </h1>
        </motion.div>

        {/* Botões Iniciais - Simétricos e Tecnológicos */}
        <AnimatePresence>
          {!showChatbox && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ duration: 0.4 }}
              className="mt-14 flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-center justify-center"
            >
              <button
                onClick={() => setShowChatbox(true)}
                className="group relative flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-cyan-600 dark:bg-cyan-500/10 backdrop-blur-xl border border-transparent dark:border-cyan-400/50 text-white dark:text-cyan-300 font-bold uppercase tracking-[0.2em] text-[11px] overflow-hidden transition-all hover:bg-cyan-700 dark:hover:bg-cyan-500/20 shadow-xl dark:shadow-[0_0_30px_rgba(34,211,238,0.15)] hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-cyan-400/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <SparklesIcon className="w-4 h-4" />
                Criar meu agente
              </button>

              <button
                onClick={() => signIn('google', { callbackUrl: '/workstation' })}
                className="flex items-center justify-center gap-3 px-10 py-4 rounded-xl border border-slate-300 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md text-slate-800 dark:text-white font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm hover:scale-105"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                Acessar Conta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ========================================= */}
      {/* CHATBOX (Aparece ao clicar em Criar Agente) */}
      {/* ========================================= */}
      <AnimatePresence>
        {showChatbox && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            className="w-full max-w-[500px] z-20 mt-[-20px] relative"
          >
            <MenuNavigation />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS do Glitch Ciano Moderno */}
      <style jsx global>{`
        .cyber-glitch::before,
        .cyber-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.8;
        }
        
        /* Reflexo Ciano Claro (Modo Light e Dark) */
        .cyber-glitch::before {
          left: 2px;
          text-shadow: -2px 0 #06b6d4;
          clip: rect(24px, 550px, 90px, 0);
          animation: glitch-anim 3s infinite linear alternate-reverse;
        }
        
        /* Reflexo Azul/Ciano Escuro */
        .cyber-glitch::after {
          left: -2px;
          text-shadow: -2px 0 #3b82f6;
          clip: rect(85px, 550px, 140px, 0);
          animation: glitch-anim 2.5s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim {
          0% { clip: rect(10px, 9999px, 80px, 0); }
          20% { clip: rect(60px, 9999px, 10px, 0); transform: translate(-1px, 1px); }
          40% { clip: rect(20px, 9999px, 90px, 0); transform: translate(1px, -1px); }
          60% { clip: rect(90px, 9999px, 30px, 0); transform: translate(-1px, 0); }
          80% { clip: rect(30px, 9999px, 70px, 0); transform: translate(1px, 1px); }
          100% { clip: rect(70px, 9999px, 20px, 0); transform: translate(0); }
        }
      `}</style>
    </main>
  );
}