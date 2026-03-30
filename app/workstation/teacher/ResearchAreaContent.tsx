"use client";

import { motion } from "framer-motion";
import { Search, BookOpen, Globe, FileText, ExternalLink } from "lucide-react";

export default function ResearchAreaContent() {
    return (
        <div className="p-6 md:p-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full h-full">

            {/* HEADER CARD */}
            <div className="w-full p-8 rounded-[2rem] bg-white/40 dark:bg-slate-900/20 backdrop-blur-3xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Search className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                                Área de Pesquisa
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-white/50">
                                Acesse repositórios acadêmicos, bases de dados e agregadores de artigos científicos.
                            </p>
                        </div>
                    </div>

                    {/* SEARCH BAR */}
                    <div className="flex items-center gap-3 mt-2 bg-white/50 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/10 p-3 focus-within:border-indigo-500/40 transition-colors">
                        <Search size={18} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Busque por título, autor, DOI ou palavra-chave..."
                            className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* QUICK ACCESS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Globe, title: "Google Scholar", desc: "Busca global em artigos, teses e livros acadêmicos.", color: "blue" },
                    { icon: BookOpen, title: "Repositório Institucional", desc: "Acesse teses e dissertações da sua universidade.", color: "emerald" },
                    { icon: FileText, title: "Meus Artigos Salvos", desc: "Revisão de artigos salvos e anotações pessoais.", color: "amber" },
                ].map((item) => {
                    const Icon = item.icon;
                    const colorMap: Record<string, string> = {
                        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    };
                    return (
                        <motion.button
                            key={item.title}
                            whileHover={{ scale: 1.02 }}
                            className="flex flex-col text-left p-6 rounded-[2rem] bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-300"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorMap[item.color]}`}>
                                <Icon size={24} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                {item.title}
                                <ExternalLink size={14} className="opacity-40" />
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-white/60 leading-relaxed">{item.desc}</p>
                        </motion.button>
                    );
                })}
            </div>

            {/* EMPTY STATE */}
            <div className="p-8 rounded-[2rem] bg-white/30 dark:bg-[#1a1a1a]/30 backdrop-blur-3xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center min-h-[200px] gap-3">
                <BookOpen size={36} className="text-slate-300 dark:text-white/20" />
                <span className="text-sm font-semibold text-slate-400 dark:text-white/30">
                    Nenhuma pesquisa recente
                </span>
                <span className="text-xs text-slate-400 dark:text-white/20 text-center max-w-md">
                    Utilize a barra de busca acima para explorar artigos científicos. Seus resultados recentes aparecerão aqui.
                </span>
            </div>
        </div>
    );
}
