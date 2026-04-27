"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";
import { useTranslation } from "react-i18next";
import {
    CalendarDaysIcon,
    SparklesIcon,
    BookOpenIcon,
    ArrowTopRightOnSquareIcon,
    RocketLaunchIcon
} from "@heroicons/react/24/outline";

// --- TYPES ---
interface NewsPost {
    id: string;
    title: Record<string, string>;
    subtitle: Record<string, string>;
    content: Record<string, string>;
    imageUrl: string;
    publishDate: string;
    status: string;
    category: "news" | "report";
}

// --- LOUPE TEXT (Modo Leitura com Foco) ---
function LoupeText({ content }: { content: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoupeEnabled, setIsLoupeEnabled] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    return (
        <div className="space-y-6 mt-8 border-t border-slate-200 dark:border-white/10 pt-8">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conteúdo da Matéria</span>
                <button
                    onClick={() => setIsLoupeEnabled(!isLoupeEnabled)}
                    className={`text-[10px] font-bold px-4 py-2 rounded-full border transition-all ${isLoupeEnabled ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30' : 'text-slate-500 border-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >
                    {isLoupeEnabled ? "DESATIVAR FOCO" : "ATIVAR MODO FOCO"}
                </button>
            </div>
            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                className={`relative ${isLoupeEnabled ? 'cursor-crosshair' : ''}`}
            >
                <p className={`text-base md:text-lg leading-loose font-serif whitespace-pre-wrap transition-colors duration-500 ${isLoupeEnabled ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                    {content}
                </p>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function LoungeNewsFeed() {
    const { i18n } = useTranslation();
    const activeLocale = i18n?.language ? i18n.language.split('-')[0] : 'pt';

    const [newsList, setNewsList] = useState<NewsPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsPost | null>(null);

    // Ref para rolar até o topo do conteúdo no mobile
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (res.ok) {
                    const data = await res.json();
                    const sorted = data.sort((a: any, b: any) =>
                        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
                    );
                    const publishedNews = sorted.filter((post: NewsPost) => post.status === 'published');
                    setNewsList(publishedNews);

                    // Seleciona automaticamente a primeira notícia ao carregar
                    if (publishedNews.length > 0) {
                        setSelectedNews(publishedNews[0]);
                    }
                }
            } catch (e) {
                console.error("Erro ao buscar notícias:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, []);

    const handleSelectNews = (post: NewsPost) => {
        setSelectedNews(post);
        // No mobile, rola a tela até a área de leitura
        if (window.innerWidth < 1024 && contentRef.current) {
            contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (isLoading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sincronizando Banco de Dados</div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto h-full min-h-[85vh] flex flex-col lg:flex-row gap-8 p-4 md:p-6 lg:p-8">

            {/* --- BARRA LATERAL (LISTA DE NOTÍCIAS) --- */}
            <aside className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 flex flex-col h-full lg:h-[85vh]">
                <div className="pb-6 border-b border-slate-200 dark:border-white/10 mb-6">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
                        The Lounge <SparklesIcon className="w-6 h-6 text-cyan-500" />
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">
                        {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                    </p>
                </div>

                {/* --- NOVO: DESTAQUE HEDERA HACKATHON --- */}
                <Link href="/news/hedera-hackathon-2025">
                    <div className="mb-6 group cursor-pointer relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 shadow-lg transition-all duration-300 hover:border-indigo-500/60 hover:shadow-indigo-500/20">
                        {/* Brilho de fundo animado (hover) */}
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex gap-4 items-center relative z-10">
                            {/* ESPAÇO DA IMAGEM PEQUENA (CAPA DO DESTAQUE) */}
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-indigo-500/20 bg-indigo-900/50">
                                {/* 👇 SUBSTITUA O LINK ABAIXO PELA SUA IMAGEM 👇 */}
                                <NextImage
                                    src="https://images.unsplash.com/photo-1639762681485-074b7f4ec651?q=80&w=200&auto=format&fit=crop" // <-- COLOQUE_O_LINK_DA_SUA_IMAGEM_AQUI
                                    alt="Hedera Hackathon"
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                                    <RocketLaunchIcon className="w-3 h-3" /> Special Feature
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-500 transition-colors">
                                    Hedera Hackathon Cobertura Exclusiva
                                </h3>
                            </div>
                        </div>
                    </div>
                </Link>
                {/* ------------------------------------------- */}

                {/* Lista com Scroll Oculto */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {newsList.map((item) => {
                        const isSelected = selectedNews?.id === item.id;
                        const title = item.title[activeLocale] || item.title['pt'] || "";

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleSelectNews(item)}
                                className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden
                                    ${isSelected
                                        ? 'bg-white dark:bg-slate-800 border-cyan-500 shadow-md scale-[1.02]'
                                        : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/10'
                                    }`}
                            >
                                {/* Indicador lateral sutil para o item ativo */}
                                {isSelected && (
                                    <motion.div layoutId="activeIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                                )}

                                <div className="flex gap-4">
                                    {item.imageUrl && (
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                            <NextImage
                                                src={item.imageUrl}
                                                alt={title}
                                                fill
                                                className={`object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${item.category === 'report' ? 'text-amber-500' : 'text-cyan-600'}`}>
                                                {item.category === 'report' ? 'Report' : 'News'}
                                            </span>
                                        </div>
                                        <h3 className={`text-sm font-bold line-clamp-2 leading-tight transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {title}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* --- ÁREA PRINCIPAL (LEITURA DA NOTÍCIA) --- */}
            <main ref={contentRef} className="flex-1 bg-white dark:bg-[#0f172a] rounded-[40px] border border-slate-200 dark:border-white/10 overflow-hidden relative shadow-2xl lg:h-[85vh] lg:overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    {selectedNews ? (
                        <motion.article
                            key={selectedNews.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="p-6 md:p-10 lg:p-16"
                        >
                            {/* Imagem de Capa */}
                            {selectedNews.imageUrl && (
                                <div className="relative w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden mb-10 shadow-lg">
                                    <NextImage
                                        src={selectedNews.imageUrl}
                                        alt="Cover"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                    {/* Tag Flutuante na Imagem */}
                                    <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                        <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                            <CalendarDaysIcon className="w-3 h-3" />
                                            {new Date(selectedNews.publishDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cabeçalho do Artigo */}
                            <div className="max-w-3xl mx-auto">
                                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6 tracking-tight">
                                    {selectedNews.title[activeLocale] || selectedNews.title['pt']}
                                </h1>

                                <h2 className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium italic mb-8">
                                    {selectedNews.subtitle[activeLocale] || selectedNews.subtitle['pt']}
                                </h2>

                                {/* Botão para Página de Report Dedicada (Condicional) */}
                                {selectedNews.category === 'report' && (
                                    <div className="mb-10 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                <BookOpenIcon className="w-4 h-4" /> Artigo de Profundidade
                                            </h4>
                                            <p className="text-xs text-slate-500">Este conteúdo possui uma página dedicada de leitura.</p>
                                        </div>
                                        <Link href={`/study-rooms/lounge/main-lounge/news/articles/page?id=${selectedNews.id}`}>
                                            <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-full transition-colors shadow-lg shadow-amber-500/30">
                                                Acessar Report <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                )}

                                {/* Texto da Notícia com a Lupa */}
                                <LoupeText content={selectedNews.content[activeLocale] || selectedNews.content['pt'] || ""} />
                            </div>
                        </motion.article>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic font-serif">
                            Selecione uma matéria na lista ao lado.
                        </div>
                    )}
                </AnimatePresence>
            </main>

            {/* --- ESTILOS DE SCROLL INLINE --- */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(148, 163, 184, 0.3);
                    border-radius: 20px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}