"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
    SparklesIcon,
    DocumentTextIcon,
    BuildingLibraryIcon,
    UserGroupIcon,
    GlobeAltIcon,
    CheckCircleIcon,
    CpuChipIcon
} from "@heroicons/react/24/outline";
import MatrixRain from "@/components/main/star-background";

// --- FEATURES COM ÍCONES ---
const FEATURES = [
    {
        id: 1,
        name: "Assistentes Inteligentes",
        icon: SparklesIcon,
        description: "Agentes multi-uso e multi-tarefas, modelos refinados com tecnologia das maiores empresas de IA da atualidade. Mais do que te ajudar nos seus estudos, eles te acompanham na sua rotina diária, te lembrando o que precisa ser feito - ou fazendo por você."
    },
    {
        id: 2,
        name: "Criação de documentos",
        icon: DocumentTextIcon,
        description: "Entregue TCCs, relatórios, tarefas e muito mais, sem se preocupar com formatação ou regras chatas. Deixe tudo com nossos agentes e ganhe tempo."
    },
    {
        id: 3,
        name: "Salas de estudo completas",
        icon: BuildingLibraryIcon,
        description: "Organize toda a sua vida estudantil em um único espaço: estude, assista vídeos, faça pesquisas, anote coisas importantes, converse com especialistas e muito mais."
    },
    {
        id: 4,
        name: "Colaboração em grupo",
        icon: UserGroupIcon,
        description: "Faça trabalhos em grupo: converse com seus amigos, criem grupos de estudos, refinem seus conhecimentos ou conecte-se com outros estudantes do país."
    },
    {
        id: 5,
        name: "Publique seu conhecimento",
        icon: GlobeAltIcon,
        description: "Publique seus trabalhos, estudos e pesquisas em um ambiente inteligente, feito para destacar globalmente entregas de alta qualidade."
    },
];

export default function FeaturesPage() {
    const { t } = useTranslation();

    // Inicia no 1 para o usuário já ver o efeito visual logo de cara (Opcional)
    const [selectedFeature, setSelectedFeature] = useState<number | null>(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // --- ESTÉTICA DOS MÓDULOS ---
    const panelStyle = "w-full max-w-[440px] rounded-[32px] overflow-hidden backdrop-blur-2xl transition-all duration-500 bg-white/40 dark:bg-cyan-950/10 border border-slate-200 dark:border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col relative z-40";

    // Fixamos a altura do botão (h-[72px]) para que a matemática do alinhamento do fio seja perfeita
    const cardBaseStyle = "group relative overflow-hidden flex items-center justify-between rounded-2xl min-h-[72px] w-full transition-all duration-300 cursor-pointer font-medium text-slate-800 dark:text-white bg-white/50 hover:bg-white/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 hover:border-cyan-400/50 dark:hover:border-cyan-400/30 shadow-sm";

    const cardSelectedStyle = "border-cyan-400 dark:border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.2)] scale-[1.02] z-10";

    const accentBar = (active: boolean) => `absolute left-1 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-full transition-all duration-500 ${active ? "bg-cyan-500 dark:bg-cyan-400 opacity-100 scale-y-100" : "bg-transparent opacity-0 scale-y-0"}`;

    if (!mounted) return <div className="w-full h-screen bg-[#eef2f6] dark:bg-[#030014]"><MatrixRain /></div>;

    const activeFeatureData = FEATURES.find(f => f.id === selectedFeature);
    const activeIndex = FEATURES.findIndex(f => f.id === selectedFeature);

    // O cálculo de alinhamento vertical: 72px (altura do card) + 12px (gap do space-y-3) = 84px de passo
    const verticalOffset = activeIndex !== -1 ? activeIndex * 84 : 0;

    return (
        <div className="w-full h-screen bg-[#eef2f6] dark:bg-[#030014] overflow-hidden relative flex items-center justify-center transition-colors duration-500">
            <MatrixRain />

            {/* --- GRID DE CONTEÚDO --- */}
            <div className="z-20 w-full max-w-[1700px] h-full grid grid-cols-1 lg:grid-cols-12 gap-0 relative">

                {/* PERSONAGEM (ESQUERDA) E CARD DESCRIÇÃO ANIMADO */}
                <div className="absolute bottom-0 left-0 w-full h-full lg:static lg:col-span-7 flex items-end justify-center lg:justify-start pointer-events-none z-10 relative">
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className="relative w-full h-full flex items-end">
                        <div className="absolute bottom-50 left-[5%] w-[80%] h-[90%] blur-[120px] rounded-full bg-cyan-400/20 dark:bg-blue-900/15" />
                        <Image src="/assets/zaeon-tree.png" alt="Zaeon Baby" fill className="object-contain object-bottom origin-bottom scale-95" priority />
                    </motion.div>

                    {/* CARD DE DESCRIÇÃO (GADGET HITECH - SEGUE A SELEÇÃO) */}
                    <AnimatePresence>
                        {activeFeatureData && (
                            <motion.div
                                key="description-card"
                                initial={{ opacity: 0, x: -30 }}
                                // AJUSTE DE ALINHAMENTO: top base 210px + o offset vertical para alinhar com o modulo selecionado
                                animate={{ opacity: 1, x: 0, y: verticalOffset }}
                                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                                className="absolute left-[5%] lg:left-[15%] top-[160px] w-[320px] lg:w-[420px] pointer-events-auto z-50"
                            >
                                {/* O Fio Conector (SVG) que sai do meio do card para a direita */}
                                <div className="absolute top-1/2 -right-10 lg:-right-24 w-10 lg:w-24 h-[2px] hidden lg:block -translate-y-1/2 z-0">
                                    <svg width="100%" height="20" className="overflow-visible">
                                        <path d="M 0 10 L 100 10" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-400/30" />
                                        <motion.path
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 1, ease: "easeInOut" }}
                                            d="M 0 10 L 100 10"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]"
                                            strokeDasharray="4 4"
                                        />
                                        <circle cx="100" cy="10" r="3" className="fill-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                                    </svg>
                                </div>

                                <div className="bg-white/70 dark:bg-black/50 backdrop-blur-3xl border border-white/60 dark:border-cyan-500/30 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(34,211,238,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                                    {/* Efeito de Reflexo no Vidro */}
                                    <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent -rotate-45 translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none" />

                                    {/* HEADER DO CARD COM CHECK SEMPRE ATIVO */}
                                    <div className="flex items-center gap-4 mb-4 relative z-10 border-b border-slate-200/50 dark:border-cyan-500/20 pb-4">
                                        <div className="p-2.5 bg-cyan-50 dark:bg-cyan-500/20 rounded-full border border-cyan-200 dark:border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                                            <CheckCircleIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <h3 className="text-base font-black uppercase tracking-widest text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-cyan-200 leading-tight">
                                            {activeFeatureData.name}
                                        </h3>
                                    </div>

                                    {/* DESCRIÇÃO */}
                                    <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-cyan-50/80 leading-relaxed relative z-10">
                                        {activeFeatureData.description}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* GADGET DE FEATURES (DIREITA) */}
                <div className="absolute inset-0 lg:static lg:col-span-5 flex flex-col justify-center items-center lg:items-start z-40 px-6">
                    <div className="flex flex-col gap-4 w-full max-w-[440px]">

                        {/* HIGHLIGHT BOX SUPERIOR */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-6 py-4 rounded-[24px] flex items-center justify-center border border-cyan-400/50 dark:border-cyan-500/30 bg-cyan-50/80 dark:bg-cyan-950/20 backdrop-blur-3xl shadow-[0_10px_30px_rgba(34,211,238,0.1)]"
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <CpuChipIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-800 dark:text-white">
                                    DESCUBRA OS PODERES DE <span className="text-cyan-600 dark:text-cyan-400">ZAEON OS</span>
                                </span>
                            </div>
                        </motion.div>

                        {/* LISTA DE FEATURES (OS MÓDULOS) */}
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className={panelStyle}>

                            {/* Header Interno */}
                            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-cyan-200">FUNCIONALIDADES DO SISTEMA</span>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="pl-1 pb-2">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">

                                    </h2>
                                    <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 dark:text-white/40 font-black mt-1">

                                    </p>
                                </div>

                                <div className="space-y-3 relative">
                                    {FEATURES.map((feature) => {
                                        const isSelected = selectedFeature === feature.id;
                                        return (
                                            <button
                                                key={feature.id}
                                                onClick={() => setSelectedFeature(feature.id)}
                                                className={`${cardBaseStyle} ${isSelected ? cardSelectedStyle : ""}`}
                                            >
                                                {/* Efeito Glow interno no módulo ativo */}
                                                <AnimatePresence>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent dark:from-cyan-400/20 dark:to-transparent z-0 pointer-events-none"
                                                        />
                                                    )}
                                                </AnimatePresence>

                                                <div className={accentBar(isSelected)} />

                                                <div className="flex items-center gap-4 pl-2 py-2 w-full pr-4 relative z-10">
                                                    {/* Ícone Chamativo */}
                                                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${isSelected ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-white/40'}`}>
                                                        <feature.icon className="w-5 h-5" />
                                                    </div>

                                                    <h3 className={`text-xs font-black tracking-wide text-left leading-tight transition-colors ${isSelected ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-700 dark:text-white/80'}`}>
                                                        {feature.name}
                                                    </h3>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>

                        <p className="mt-4 text-[9px] text-center text-slate-500 dark:text-cyan-900/60 font-medium tracking-[0.3em] uppercase opacity-60">
                            &copy; Zaeon Collective Intelligence, 2026.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%) rotate(-45deg); }
                }
            `}</style>
        </div>
    );
}