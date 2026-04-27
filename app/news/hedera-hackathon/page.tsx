"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";
import {
    ArrowLeftIcon,
    BuildingLibraryIcon,
    DocumentTextIcon,
    CodeBracketIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    CheckBadgeIcon,
    LinkIcon
} from "@heroicons/react/24/outline";

// ============================================================================
// DADOS DOS PROJETOS (PLACEHOLDERS PARA O GITHUB)
// ============================================================================
const DELIVERED_PROJECTS = [
    {
        id: 1,
        title: "AgriChain Nordeste",
        description: "Sistema de rastreabilidade de safra familiar utilizando Hedera Consensus Service, focado em pequenos produtores do semiárido.",
        github: "https://github.com/SEU_USUARIO/agrichain-nordeste", // <-- COLOQUE SEU LINK AQUI
        status: "Entregue & Auditado"
    },
    {
        id: 2,
        title: "Identidade Malês (Refugiados)",
        description: "DApp de identidade descentralizada para estudantes e refugiados africanos, garantindo portabilidade de histórico acadêmico.",
        github: "https://github.com/SEU_USUARIO/identidade-males", // <-- COLOQUE SEU LINK AQUI
        status: "Entregue & Auditado"
    },
    {
        id: 3,
        title: "Zaeon Micro-Funding Protocol",
        description: "Smart contracts em Solidity para micro-distribuição de bolsas de pesquisa automatizadas via rede Hedera.",
        github: "https://github.com/SEU_USUARIO/zaeon-microfunding", // <-- COLOQUE SEU LINK AQUI
        status: "Entregue & Auditado"
    },
    {
        id: 4,
        title: "EcoLedger Baiano",
        description: "Tokenização de créditos de logística reversa e reciclagem para cooperativas da Bahia e Ceará.",
        github: "https://github.com/SEU_USUARIO/ecoledger-baiano", // <-- COLOQUE SEU LINK AQUI
        status: "Entregue & Auditado"
    },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function InstitucionalReportPage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-800 dark:text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden font-sans pb-24">

            {/* HEADER INSTITUCIONAL */}
            <div className="relative w-full pt-32 pb-16 flex flex-col items-center justify-center overflow-hidden border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl">
                <Link href="/news" className="absolute top-8 left-8 z-20">
                    <button className="flex items-center gap-2 px-5 py-2.5 backdrop-blur-xl bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm rounded-full text-slate-800 dark:text-slate-200 text-xs font-semibold tracking-wide hover:bg-white dark:hover:bg-white/10 transition-all">
                        <ArrowLeftIcon className="w-4 h-4" /> Retornar
                    </button>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center"
                >
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <BuildingLibraryIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-4">
                        Documento Oficial de Transparência
                    </h4>
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-6">
                        Relatório de Impacto Técnico e Justificativa de Prazos
                    </h1>
                    <p className="text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        À FUNCAP & SUDENE • Ciclo 2026
                    </p>
                </motion.div>
            </div>

            {/* CORPO DO RELATÓRIO */}
            <main className="w-full max-w-4xl mx-auto px-6 mt-16 space-y-16">

                {/* SEÇÃO 1: O CONTEXTO DA OMISSÃO TEMPORÁRIA */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="p-10 md:p-14 rounded-[2.5rem] backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">O Fator Escala e o Gargalo Operacional</h2>
                    </div>

                    <div className="space-y-6 text-lg font-serif leading-relaxed text-slate-700 dark:text-slate-300">
                        <p>
                            Prezados representantes da <strong>FUNCAP</strong> e da <strong>SUDENE</strong>, este documento serve não apenas como uma prestação de contas dos projetos desenvolvidos, mas como um registro histórico do que ocorre quando uma equipe diminuta colide com um sucesso em escala global.
                        </p>
                        <p>
                            A justificativa central para o atraso no envio desta prestação burocrática reside em um cálculo operacional simples, porém brutal: <strong>A Equipe Zaeon operou o maior hackathon de blockchain da história com uma infraestrutura humana de microempresa.</strong>
                        </p>
                        <p>
                            O que iniciou como uma iniciativa de fomento local nas instalações da Unilab e no Campus dos Malês, escalou de forma incontrolável. Fomos responsáveis por gerir, orientar e auditar tecnicamente <strong>468 indivíduos</strong>, lidando simultaneamente com quatro idiomas (Português, Francês, Inglês e dialetos locais africanos). Essa multidão precisou ser estruturada e liderada para entregar <strong>50 projetos complexos</strong> em arquitetura Web3.
                        </p>
                    </div>
                </motion.section>

                {/* SEÇÃO 2: A PRORROGAÇÃO E A PRESSÃO INSTITUCIONAL */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="relative p-10 md:p-14 rounded-[2.5rem] backdrop-blur-2xl bg-indigo-500/5 dark:bg-indigo-500/5 border border-indigo-500/20 dark:border-indigo-500/20 shadow-inner"
                >
                    <div className="absolute top-0 right-10 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />

                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <CpuChipIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">A Pressão de Representar o Nordeste Globalmente</h2>
                    </div>

                    <div className="space-y-6 text-lg font-serif leading-relaxed text-slate-700 dark:text-slate-300 relative z-10">
                        <p>
                            A burocracia exige previsibilidade, mas a inovação de fronteira é caótica. Quando a DoraHacks e a Hedera anunciaram a prorrogação do evento — estendendo o prazo de Julho para o final de Outubro — seguido de dezembro, janeiro, fevereiro e março no pós evento, para implementar as soluções vencedoras na blockchain Hedera, o nível técnico da competição disparou. Estávamos agora concorrendo contra mais de <strong>1.000 projetos de ponta</strong>, desenvolvidos por startups do Vale do Silício e da Europa, disputando mais de 1 milhão de dólares em prêmios.
                        </p>
                        <blockquote className="border-l-4 border-indigo-500 pl-6 py-2 my-8 italic text-xl font-medium text-slate-900 dark:text-slate-100 bg-white/40 dark:bg-black/20 rounded-r-xl">
                            "A escolha era binária: paralisar o suporte técnico de 50 equipes para preencher formulários institucionais, ou garantir que o Nordeste e a África entregassem códigos invioláveis e produtos de nível internacional."
                        </blockquote>
                        <p>
                            A equipe Zaeon escolheu a entrega. Cada hora útil de nossa equipe enxuta foi dedicada a depurar <em>Smart Contracts</em>, refinar interfaces e agir como barreira de contenção contra o <em>burnout</em> massivo dos alunos. Houve uma pressão institucional e moral esmagadora de não deixar que as limitações estruturais de nossos alunos fossem motivo de vexame perante o cenário global.
                        </p>
                        <p>
                            O atraso na formalização não foi um ato de negligência administrativa, mas um sacrifício operacional necessário para garantir a execução técnica de um feito histórico.
                        </p>
                    </div>
                </motion.section>

                {/* SEÇÃO 3: PROJETOS ENTREGUES (OS LINKS) */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                >
                    <div className="flex items-center gap-3 mb-10 pl-4">
                        <CheckBadgeIcon className="w-8 h-8 text-emerald-500" />
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Entregas Validadas & Repositórios</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {DELIVERED_PROJECTS.map((project, idx) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                                className="group p-8 rounded-[2rem] bg-white/70 dark:bg-[#0f172a]/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-black/50 flex items-center justify-center border border-slate-200 dark:border-white/5 group-hover:bg-emerald-500/10 transition-colors">
                                        <CodeBracketIcon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-500" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        {project.status}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                    {project.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-1">
                                    {project.description}
                                </p>

                                <a
                                    href={project.github}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                                >
                                    <LinkIcon className="w-4 h-4" /> Acessar GitHub
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* CONCLUSÃO E ASSINATURA */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="mt-16 pt-12 border-t border-slate-200 dark:border-white/10 text-center"
                >
                    <p className="text-slate-600 dark:text-slate-400 font-serif italic text-lg max-w-2xl mx-auto mb-8">
                        Reiteramos nosso compromisso inabalável com o desenvolvimento científico e tecnológico do Estado do Ceará e do Nordeste. Entregamos o que nos foi confiado, superando as expectativas globais, e agora nos colocamos à inteira disposição para o saneamento burocrático e fiscal deste ciclo.
                    </p>
                    <div className="inline-block text-left">
                        <p className="text-slate-900 dark:text-white font-bold text-lg">Equipe Técnica & Operacional Zaeon</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Baturité, Ceará, Brasil — Abril de 2026</p>
                    </div>
                </motion.section>

            </main>
        </div>
    );
}