"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
    SparklesIcon,
    DocumentTextIcon,
    BuildingLibraryIcon,
    UserGroupIcon,
    GlobeAltIcon,
    CpuChipIcon,
} from "@heroicons/react/24/outline";
import StarBackground from "@/components/main/star-background";

const FEATURES = [
    {
        id: 1,
        name: "Assistentes Inteligentes",
        icon: SparklesIcon,
        description: "Agentes multi-uso e multi-tarefas, modelos refinados com tecnologia das maiores empresas de IA da atualidade. Eles acompanham a sua rotina diária, relembrando o que precisa ser feito - ou fazendo por si.",
        align: "left"
    },
    {
        id: 2,
        name: "Criação de Documentos",
        icon: DocumentTextIcon,
        description: "Entregue relatórios, artigos, tarefas e muito mais, sem se preocupar com formatação. Confie a revisão aos nossos agentes e ganhe tempo na pesquisa.",
        align: "right"
    },
    {
        id: 3,
        name: "Salas de Estudo Completas",
        icon: BuildingLibraryIcon,
        description: "Organize a sua vida estudantil num único espaço: estude, assista a vídeos, anote ideias vitais e converse com especialistas neurais a qualquer momento.",
        align: "left"
    },
    {
        id: 4,
        name: "Colaboração em Grupo",
        icon: UserGroupIcon,
        description: "Trabalhos em grupo elevados ao próximo nível: debatam ideias com amigos, criem grupos de estudo e conectem-se com outros investigadores.",
        align: "right"
    },
    {
        id: 5,
        name: "Publique o Seu Conhecimento",
        icon: GlobeAltIcon,
        description: "Disponibilize os seus trabalhos, teses e pesquisas num ambiente concebido para destacar globalmente entregas de alta qualidade académica.",
        align: "left"
    },
];

// --- COMPONENTE DO MÓDULO HIGHTECH ---
const FeatureCard = ({ feature, progress, index, total }: any) => {
    const isLeft = feature.align === "left";

    // O ponto de ativação é distribuído uniformemente ao longo do container
    const activationPoint = (index + 0.5) / total;

    // O desenho da ramificação começa 10% antes de a barra central chegar ao módulo
    const drawStart = Math.max(0, activationPoint - 0.1);
    const drawEnd = activationPoint;

    // HOOKS DE ANIMAÇÃO BASEADOS NO SCROLL
    const pathLength = useTransform(progress, [drawStart, drawEnd], [0, 1]);
    const isEnergized = useTransform(progress, [drawStart, drawEnd], [0, 1]);

    // O Card passa de "adormecido" para "ligado" e MATÉM-SE ligado se descer mais
    const cardOpacity = useTransform(progress, [drawStart, drawEnd], [0.3, 1]);
    const cardScale = useTransform(progress, [drawStart, drawEnd], [0.95, 1]);

    // Transição de Cores e Brilhos de Energização
    const borderColor = useTransform(isEnergized, [0, 1], ["rgba(255,255,255,0.05)", "rgba(6, 182, 212, 0.8)"]);
    const shadow = useTransform(isEnergized, [0, 1], [
        "0px 0px 0px rgba(6,182,212,0), inset 0px 0px 0px rgba(6,182,212,0)",
        "0px 0px 40px rgba(6,182,212,0.3), inset 0px 0px 20px rgba(6,182,212,0.15)"
    ]);

    const iconColor = useTransform(isEnergized, [0, 1], ["#475569", "#06b6d4"]);
    const iconBg = useTransform(isEnergized, [0, 1], ["rgba(255,255,255,0.02)", "rgba(6, 182, 212, 0.15)"]);

    // Opacidade dos nós (bolinhas) de conexão SVG
    const nodeStartOpacity = useTransform(pathLength, [0, 0.1], [0, 1]);
    const nodeEndOpacity = useTransform(pathLength, [0.9, 1], [0, 1]);

    // Paths Angulares (Circuitos) usando viewBox 0 0 100 100
    // Right: Sai do Fio(0, 20) -> Direita(40, 20) -> Desce Angulado(60, 50) -> Entra no Card(100, 50)
    const pathRight = "M 0 20 L 40 20 L 60 50 L 100 50";
    // Left: Sai do Fio(100, 20) -> Esquerda(60, 20) -> Desce Angulado(40, 50) -> Entra no Card(0, 50)
    const pathLeft = "M 100 20 L 60 20 L 40 50 L 0 50";

    return (
        <div className={`relative w-full flex md:w-1/2 py-8 md:py-16 ${isLeft ? 'md:justify-end md:pr-16 md:ml-0' : 'md:justify-start md:pl-16 md:ml-auto'} px-6 md:px-0`}>

            {/* RAMIFICAÇÃO ANGULAR (SVG) - Visível apenas em Desktop */}
            <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-16 h-32 z-0 ${isLeft ? 'right-0' : 'left-0'}`}>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Trilha de fundo (apagada) */}
                    <path
                        d={isLeft ? pathLeft : pathRight}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Energia do circuito (Ciano Brilhante) */}
                    <motion.path
                        d={isLeft ? pathLeft : pathRight}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                        style={{ pathLength }}
                        className="drop-shadow-[0_0_10px_#06b6d4]"
                    />

                    {/* Nó de Conexão no Fio Central */}
                    <motion.circle cx={isLeft ? 100 : 0} cy="20" r="5" fill="#06b6d4" style={{ opacity: nodeStartOpacity }} className="drop-shadow-[0_0_8px_#06b6d4]" />

                    {/* Nó de Conexão no Card */}
                    <motion.circle cx={isLeft ? 0 : 100} cy="50" r="5" fill="#06b6d4" style={{ opacity: nodeEndOpacity }} className="drop-shadow-[0_0_12px_#06b6d4]" />
                </svg>
            </div>

            {/* O MÓDULO (CARD) */}
            <motion.div
                style={{ opacity: cardOpacity, scale: cardScale, borderColor, boxShadow: shadow }}
                className="relative z-10 w-full max-w-[420px] bg-slate-900/60 dark:bg-[#060b14]/90 backdrop-blur-2xl border-2 rounded-2xl p-8 flex flex-col gap-5 transition-colors"
            >
                {/* Detalhes Tecnominimalistas (Cruzes nos Cantos) */}
                <div className="absolute top-4 left-4 w-2 h-2 border-t-2 border-l-2 border-slate-500/50" />
                <div className="absolute top-4 right-4 w-2 h-2 border-t-2 border-r-2 border-slate-500/50" />
                <div className="absolute bottom-4 left-4 w-2 h-2 border-b-2 border-l-2 border-slate-500/50" />
                <div className="absolute bottom-4 right-4 w-2 h-2 border-b-2 border-r-2 border-slate-500/50" />

                {/* Brilho Superior de Vidro */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="flex items-center gap-4 relative z-10">
                    <motion.div
                        className="p-3 rounded-xl border border-cyan-500/20 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: iconBg, color: iconColor }}
                    >
                        <feature.icon className="w-6 h-6" />
                    </motion.div>
                    <h3 className="text-lg font-black uppercase tracking-wider text-slate-100 dark:text-white leading-tight">
                        {feature.name}
                    </h3>
                </div>

                <p className="text-[14px] font-medium text-slate-400 dark:text-slate-400 leading-relaxed relative z-10">
                    {feature.description}
                </p>
            </motion.div>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
export default function FeaturesPage() {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // 1. Hook de Scroll Rastreando com Precisão o Container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end end"]
    });

    // 2. Spring (Amortecedor) Afinado para Alta Reatividade ao Mouse Scroll
    const springProgress = useSpring(scrollYProgress, {
        stiffness: 200, // Mais firme (responde mais rápido ao rato)
        damping: 40,    // Amortecimento suave
        restDelta: 0.001
    });

    // 3. Altura do fio central neural
    const lineHeight = useTransform(springProgress, [0, 1], ["0%", "100%"]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Proteção de Renderização
    if (!mounted) {
        return (
            <div className="w-full h-screen bg-[#030508] flex items-center justify-center">
                <StarBackground />
            </div>
        );
    }

    return (
        <div className="relative bg-[#030508] text-white transition-colors duration-700 font-sans overflow-hidden">

            {/* Background 100% Limpo (Sem opacidades cortando as estrelas) */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <StarBackground />
            </div>

            {/* Cabeçalho Flutuante */}
            <div className="relative z-10 pt-32 pb-24 px-6 text-center flex flex-col items-center">
                <div className="px-5 py-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 backdrop-blur-md mb-6 flex items-center gap-2 w-fit shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <CpuChipIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
                        Zaeon Neural Architecture
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-light tracking-tighter max-w-4xl leading-[1.1] text-white drop-shadow-md">
                    Descubra o núcleo da sua <br className="hidden md:block" />
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">estação de trabalho.</span>
                </h1>
            </div>

            {/* CONTEINER DE CARROSSEL / ENERGIZAÇÃO */}
            <div ref={containerRef} className="relative z-10 max-w-6xl mx-auto pb-48 w-full">

                {/* O FIO CENTRAL NEURAL (SPINE) */}
                <div className="absolute top-0 bottom-0 left-6 md:left-1/2 w-[3px] bg-white/5 md:-translate-x-1/2 rounded-full overflow-hidden z-0">
                    {/* A Energia que Desce */}
                    <motion.div
                        className="absolute top-0 left-0 w-full bg-gradient-to-b from-cyan-900 via-cyan-400 to-cyan-300 shadow-[0_0_20px_rgba(6,182,212,1)]"
                        style={{ height: lineHeight }}
                    >
                        {/* Ponta da Energia (Brilho intenso na queda) */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-12 bg-white rounded-full blur-[2px] shadow-[0_0_30px_#22d3ee]" />
                    </motion.div>
                </div>

                {/* GERAÇÃO DOS MÓDULOS DE FUNCIONALIDADE */}
                <div className="relative w-full flex flex-col pt-10">
                    {FEATURES.map((feature, idx) => (
                        <FeatureCard
                            key={feature.id}
                            feature={feature}
                            index={idx}
                            total={FEATURES.length}
                            progress={springProgress}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
}