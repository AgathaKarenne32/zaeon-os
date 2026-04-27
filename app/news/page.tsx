"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";
import { useTranslation } from "react-i18next";
import {
    ChevronDownIcon,
    SparklesIcon,
    BookOpenIcon
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

    // Suavização para o efeito caso expanda a funcionalidade da lupa depois
    const smoothX = useSpring(mouseX, { stiffness: 400, damping: 30 });
    const smoothY = useSpring(mouseY, { stiffness: 400, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    return (
        <div className="space-y-4">
            <button
                onClick={() => setIsLoupeEnabled(!isLoupeEnabled)}
                className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${isLoupeEnabled ? 'bg-cyan-500 text-white border-cyan-500' : 'text-slate-500 border-slate-300'}`}
            >
                {isLoupeEnabled ? "DESATIVAR MODO LEITURA" : "ATIVAR MODO LEITURA"}
            </button>
            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                className={`relative ${isLoupeEnabled ? 'cursor-crosshair' : ''}`}
            >
                <p className={`text-sm leading-relaxed font-serif whitespace-pre-wrap transition-colors ${isLoupeEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {content}
                </p>
            </div>
        </div>
    );
}

// --- COMPONENTE DE NOTÍCIA (FRAME EXPANSÍVEL LATERAL) ---
function NewsItem({ item, locale }: { item: NewsPost, locale: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const title = item.title[locale] || item.title['pt'] || "";
    const subtitle = item.subtitle[locale] || item.subtitle['pt'] || "";
    const content = item.content[locale] || item.content['pt'] || "";

    return (
        <motion.div
            layout
            className="border-b border-slate-100 dark:border-white/5 last:border-0 py-6"
        >
            <div
                className="flex gap-6 cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {item.imageUrl && (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <NextImage
                            src={item.imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                )}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-tighter">Breaking News</span>
                        <span className="text-[10px] text-slate-400">• {new Date(item.publishDate).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-1">{subtitle}</p>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-slate-300 self-center transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-6 p-6 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <LoupeText content={content} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// --- MAIN FEED (O COMPONENTE PRINCIPAL) ---
export default function LoungeNewsFeed() {
    const { i18n } = useTranslation();

    // Correção do Build: Verifica se i18n existe antes de usar o split
    const activeLocale = i18n?.language ? i18n.language.split('-')[0] : 'pt';

    const [newsList, setNewsList] = useState<NewsPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (res.ok) {
                    const data = await res.json();
                    // Ordenar por data (mais recentes primeiro)
                    const sorted = data.sort((a: any, b: any) =>
                        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
                    );
                    setNewsList(sorted.filter((post: NewsPost) => post.status === 'published'));
                }
            } catch (e) {
                console.error("Erro ao buscar notícias:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, []);

    if (isLoading) {
        return (
            <div className="p-20 text-center font-serif italic text-slate-400">
                Carregando edição do dia...
            </div>
        );
    }

    // O primeiro 'report' vira a manchete principal
    const mainArticle = newsList.find(p => p.category === 'report');

    // O resto vira as notícias expansíveis laterais
    const sideNews = newsList.filter(p => p.id !== mainArticle?.id);

    return (
        <div className="max-w-6xl mx-auto p-6 font-serif">

            {/* Cabeçalho Estilo Jornal */}
            <header className="border-b-4 border-double border-slate-800 dark:border-white/20 pb-4 mb-10 text-center">
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">
                    The Lounge Daily
                </h1>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Vol. LXII — No. 104</span>
                    <span>{new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span>
                    <span>Preço: Free</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Coluna Principal: Artigo de Destaque (Abre nova página) */}
                <div className="lg:col-span-2">
                    {mainArticle && (
                        <Link href={`/study-rooms/lounge/main-lounge/news/articles/page?id=${mainArticle.id}`}>
                            <article className="group cursor-pointer">
                                <div className="relative aspect-[16/9] mb-6 overflow-hidden rounded-sm">
                                    <NextImage
                                        src={mainArticle.imageUrl}
                                        alt="Capa do Artigo Principal"
                                        fill
                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                    />
                                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 tracking-widest uppercase shadow-lg">
                                        Featured Article
                                    </div>
                                </div>
                                <h2 className="text-4xl font-bold leading-tight mb-4 text-slate-900 dark:text-white group-hover:underline decoration-1 underline-offset-4">
                                    {mainArticle.title[activeLocale] || mainArticle.title['pt']}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg mb-4 italic">
                                    {mainArticle.subtitle[activeLocale] || mainArticle.subtitle['pt']}
                                </p>
                                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase transition-transform group-hover:translate-x-2">
                                    <BookOpenIcon className="w-4 h-4" /> Ler artigo completo
                                </div>
                            </article>
                        </Link>
                    )}
                </div>

                {/* Coluna Lateral: Feed de Notícias (Frames Expansíveis) */}
                <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 pt-8 lg:pt-0 lg:pl-8">
                    <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-cyan-500" /> Últimas Atualizações
                    </h2>
                    <div className="flex flex-col">
                        {sideNews.map((item) => (
                            <NewsItem key={item.id} item={item} locale={activeLocale} />
                        ))}

                        {sideNews.length === 0 && (
                            <p className="text-sm text-slate-400 italic">Nenhuma atualização recente no momento.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}