"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CameraIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";

// Interface para as Fotos Pessoais
interface PersonalPhoto {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    image: string;
}

// MOCK: Dados temporários até criarmos a API de upload de fotos do usuário logado
const MOCK_PHOTOS: PersonalPhoto[] = [
    { id: "1", title: "Formatura", subtitle: "Conclusão de Ciclo", date: "15 Dez 2025", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop" },
    { id: "2", title: "Laboratório", subtitle: "Pesquisa Avançada", date: "02 Mar 2026", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop" },
    { id: "3", title: "Hackathon", subtitle: "Primeiro Lugar", date: "18 Nov 2025", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop" },
    { id: "4", title: "Estudos", subtitle: "Preparação Final", date: "10 Out 2025", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop" },
];

export default function NetworkMural() {
    const [photos, setPhotos] = useState<PersonalPhoto[]>(MOCK_PHOTOS);
    const [active, setActive] = useState(0);
    const [isLoading, setIsLoading] = useState(false); // Mantido falso por causa do Mock

    // --- CONTROLES DE NAVEGAÇÃO ---
    const nextPhoto = useCallback(() => {
        setActive((prev) => (prev + 1 < photos.length ? prev + 1 : prev));
    }, [photos.length]);

    const prevPhoto = useCallback(() => {
        setActive((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
    }, []);

    // --- NAVEGAÇÃO POR TECLADO ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextPhoto();
            if (e.key === "ArrowLeft") prevPhoto();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nextPhoto, prevPhoto]);

    // Função de Upload (Mock por enquanto)
    const triggerUpload = () => {
        alert("A rota de Upload de Fotos Pessoais será conectada em breve!");
    };

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-24 opacity-50">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-cyan-500 mb-4" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Carregando Acervo...</span>
            </div>
        );
    }

    // A Mágica do Coverflow Pessoal
    return (
        <div className="w-full flex flex-col items-center justify-center py-24 overflow-hidden relative" style={{ perspective: "1200px" }}>
            
            {/* CABEÇALHO DO MURAL */}
            <div className="mb-12 flex flex-col items-center relative z-20">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-2">Minhas Fotos</h2>
                
                {/* Botão de Adicionar Nova Foto */}
                <button onClick={triggerUpload} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-white/50 dark:bg-black/30 hover:bg-cyan-500/10 transition-colors backdrop-blur-sm text-cyan-600 dark:text-cyan-400 group">
                    <PlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Nova Foto</span>
                </button>
            </div>
            
            {/* O CARROSSEL (COVERFLOW) */}
            <div className="flex items-center justify-center relative h-[450px] w-full max-w-5xl" style={{ transformStyle: "preserve-3d" }}>
                
                {/* Setas Laterais de Navegação */}
                {photos.length > 1 && (
                    <>
                        <button onClick={prevPhoto} disabled={active === 0} className={`absolute left-4 md:left-10 z-50 p-3 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/10 transition-all ${active === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-white/40 dark:hover:bg-white/10 hover:scale-110'}`}>
                            <ChevronLeftIcon className="w-6 h-6 text-slate-800 dark:text-white" />
                        </button>
                        <button onClick={nextPhoto} disabled={active === photos.length - 1} className={`absolute right-4 md:right-10 z-50 p-3 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/10 transition-all ${active === photos.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-white/40 dark:hover:bg-white/10 hover:scale-110'}`}>
                            <ChevronRightIcon className="w-6 h-6 text-slate-800 dark:text-white" />
                        </button>
                    </>
                )}

                {/* Se não houver fotos, mostra o Empty State */}
                {photos.length === 0 ? (
                     <div className="w-full flex flex-col items-center justify-center py-24 opacity-50 z-20">
                        <CameraIcon className="w-12 h-12 text-slate-400 mb-4" />
                        <div className="text-center text-slate-500 dark:text-white/40 text-[10px] uppercase tracking-widest border-2 border-dashed border-slate-300/50 dark:border-white/10 p-6 rounded-xl backdrop-blur-sm">
                            Nenhum registro visual encontrado. <br/> Adicione sua primeira foto.
                        </div>
                    </div>
                ) : (
                    // Renderização das Cartas Puras
                    photos.map((photo, i) => {
                        const isActive = i === active;
                        const offset = i - active;
                        const sign = Math.sign(offset);
                        const absOffset = Math.abs(offset);

                        const rotateY = isActive ? 0 : sign * -35; 
                        const translateX = isActive ? 0 : sign * (absOffset * 90 + 120);
                        const translateZ = isActive ? 150 : -absOffset * 100;
                        const zIndex = 20 - absOffset;
                        const opacity = absOffset > 3 ? 0 : 1;

                        return (
                            <motion.div
                                key={photo.id}
                                onClick={() => setActive(i)}
                                animate={{ rotateY, x: translateX, z: translateZ, zIndex, opacity }}
                                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                                className={`absolute w-72 h-96 rounded-[2.5rem] cursor-pointer shadow-2xl border border-white/30 dark:border-white/10 transition-all duration-500 overflow-hidden select-none`}
                            >
                                <div className="absolute inset-0 w-full h-full">
                                    {/* A IMAGEM EM SI (Sempre visível, sem grayscale, apenas ofuscada levemente se inativa) */}
                                    <img 
                                        src={photo.image} 
                                        alt={photo.title} 
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-50'}`} 
                                    />
                                    
                                    {/* Gradiente sutil escuro embaixo SOMENTE para o texto não sumir */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                                    
                                    {/* TEXTOS (Sempre visíveis, mas mais apagados nas cartas inativas) */}
                                    <div className={`absolute bottom-6 left-6 right-6 z-10 flex flex-col items-start transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                                        <h3 className="text-xl font-black text-white leading-tight tracking-tight drop-shadow-md">{photo.title}</h3>
                                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1 drop-shadow-md">{photo.subtitle}</p>
                                        <p className="text-white/50 text-[9px] font-mono mt-2">{photo.date}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
            
            {/* Navegação por Pontos (Dots) */}
            {photos.length > 0 && (
                <div className="flex gap-2 mt-12 relative z-20">
                    {photos.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setActive(i)} 
                            className={`w-2 h-2 rounded-full transition-all ${i === active ? 'bg-cyan-400 scale-125 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-400 dark:bg-white/20 hover:bg-slate-500'}`} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}