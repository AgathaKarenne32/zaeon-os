"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image"; // 🔥 CORREÇÃO 1: Importado o componente Image do Next
import {
    ChatBubbleLeftRightIcon,
    MinusIcon,
    LockClosedIcon,
    CheckIcon,
    XMarkIcon,
    UserIcon
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface LoungeChatWidgetProps {
    defaultOpen?: boolean;
}

export const LoungeChatWidget = ({ defaultOpen = false }: LoungeChatWidgetProps) => {
    const { t } = useTranslation();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Estados da API Bidirecional
    const [incomingRequest, setIncomingRequest] = useState<any>(null); // Pedidos recebidos
    const [outgoingUpdate, setOutgoingUpdate] = useState<any>(null); // Status de pedidos que você enviou

    // Fica checando de 5 em 5 segundos
    useEffect(() => {
        const fetchNetworkActivity = async () => {
            if (!isOpen) return;

            try {
                // 1. Busca primeiro se alguém te mandou convite (Prioridade)
                const res = await fetch('/api/network/request');
                if (res.ok) {
                    const data = await res.json();
                    
                    // A API sempre retorna os pendentes
                    if (data && data.length > 0) {
                        setIncomingRequest({
                            id: data[0].id,
                            senderId: data[0].senderId,
                            senderName: data[0].sender?.name || "Agente",
                            senderImage: data[0].sender?.image || "", // Deixe string vazia se não tiver
                            message: data[0].message
                        });
                        setOutgoingUpdate(null);
                        return; // Se tem recebido, para aqui
                    } else {
                        setIncomingRequest(null);
                    }
                }

            } catch (error) { console.error("Erro na busca de rede:", error); }
        };

        // 2. Busca inicial ao abrir o widget
        if (isOpen && !incomingRequest && !outgoingUpdate) fetchNetworkActivity();
        
        // 3. Polling
        const interval = setInterval(fetchNetworkActivity, 5000);
        return () => clearInterval(interval);
    }, [isOpen, incomingRequest, outgoingUpdate]);

    const handleRespond = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!incomingRequest) return;

        try {
            await fetch('/api/network/respond', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: incomingRequest.id, status })
            });

            // Feedback visual imediato na sua própria tela (Quem recebeu)
            setOutgoingUpdate({ 
                type: status, 
                name: incomingRequest.senderName 
            });
            setIncomingRequest(null);

            // Reseta a tela de notificação após 5 segundos
            setTimeout(() => {
                setOutgoingUpdate(null);
            }, 5000);

        } catch (error) {
            console.error("Erro ao responder", error);
        }
    };

    const glassStyle = `
        dark:bg-[#0f172a]/95 bg-white/90
        backdrop-blur-xl border border-slate-300 dark:border-white/10
        shadow-2xl overflow-hidden
    `;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{
                y: 0,
                opacity: 1,
                // Ajuste de altura dinâmico baseado no que estamos mostrando
                height: isOpen ? (incomingRequest || outgoingUpdate ? 280 : 200) : 48,
                width: isOpen ? 340 : 180
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={`fixed bottom-0 right-8 z-[999] rounded-t-2xl flex flex-col ${glassStyle}`}
        >
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="h-12 flex items-center justify-between px-4 bg-slate-100 dark:bg-[#0f172a] border-b border-slate-300 dark:border-white/10 cursor-pointer shrink-0 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors relative"
            >
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className={`w-2 h-2 rounded-full ${incomingRequest && !isOpen ? 'bg-cyan-400 animate-ping absolute' : ''}`} />
                        <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-red-500' : (incomingRequest ? 'bg-cyan-500' : 'bg-emerald-500 animate-pulse')}`} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/50 truncate">
                        {incomingRequest && !isOpen
                            ? "Sinal Recebido"
                            : (isOpen ? "System Core" : "Global Chat")}
                    </span>
                </div>

                <button className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-slate-500 dark:text-white">
                    {isOpen ? <MinusIcon className="w-4 h-4" /> : <ChatBubbleLeftRightIcon className="w-4 h-4" />}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {/* --- MODO 1: RECEBEU UM PEDIDO --- */}
                {isOpen && incomingRequest ? (
                    <motion.div key="request-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col p-5 bg-slate-50 dark:bg-black/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                onClick={() => router.push(`/workstation/${incomingRequest.senderId}`)}
                                className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400 cursor-pointer hover:scale-105 transition-transform shadow-md bg-slate-200 dark:bg-black"
                            >
                                {/* 🔥 CORREÇÃO 2: Uso do componente Image do Next.js para avatar */}
                                {incomingRequest.senderImage ? (
                                    <Image 
                                        src={incomingRequest.senderImage} 
                                        alt="Profile" 
                                        fill 
                                        sizes="40px"
                                        className="object-cover" 
                                    />
                                ) : (
                                    <UserIcon className="w-full h-full p-2 text-slate-400" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-widest">Pedido de Conexão</span>
                                <span
                                    onClick={() => router.push(`/workstation/${incomingRequest.senderId}`)}
                                    className="text-sm font-black text-slate-800 dark:text-white cursor-pointer hover:underline"
                                >
                                    {incomingRequest.senderName}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 mb-4 shadow-sm">
                            {/* 🔥 CORREÇÃO 3: Escape das aspas usando &quot; */}
                            <p className="text-[11px] italic text-slate-600 dark:text-white/70 leading-relaxed font-mono">
                                &quot;{incomingRequest.message}&quot;
                            </p>
                        </div>

                        <div className="flex gap-2 mt-auto">
                            <button onClick={() => handleRespond('REJECTED')} className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
                                Recusar
                            </button>
                            <button onClick={() => handleRespond('ACCEPTED')} className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] text-[10px] font-black uppercase tracking-widest transition-colors flex justify-center items-center gap-1">
                                <CheckIcon className="w-3 h-3" /> Aceitar
                            </button>
                        </div>
                    </motion.div>

                ) : isOpen && outgoingUpdate ? (
                    // --- MODO 2: FEEDBACK APÓS ACEITAR/REJEITAR ---
                    <motion.div key="feedback-view" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`flex-1 flex flex-col items-center justify-center p-6 text-center ${outgoingUpdate.type === 'ACCEPTED' ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${outgoingUpdate.type === 'ACCEPTED' ? 'bg-cyan-500 text-white dark:text-black' : 'bg-red-500 text-white'}`}>
                            {outgoingUpdate.type === 'ACCEPTED' ? <span className="text-2xl font-black">+1</span> : <XMarkIcon className="w-8 h-8" />}
                        </div>
                        <h4 className={`text-sm font-black mb-1 ${outgoingUpdate.type === 'ACCEPTED' ? 'text-cyan-700 dark:text-cyan-400' : 'text-red-700 dark:text-red-400'}`}>
                            {outgoingUpdate.type === 'ACCEPTED' ? 'Conexão Estabelecida' : 'Pedido Recusado'}
                        </h4>
                        <p className="text-[10px] text-slate-600 dark:text-white/60 font-mono">
                            {outgoingUpdate.type === 'ACCEPTED' ? `Você e ${outgoingUpdate.name} são colegas de rede.` : `O pedido de ${outgoingUpdate.name} foi ignorado.`}
                        </p>
                    </motion.div>

                ) : isOpen ? (
                    // --- MODO 3: CHAT VAZIO / ESPERA ---
                    <motion.div key="locked-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-black/20">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center mb-3 shadow-inner">
                            <LockClosedIcon className="w-5 h-5 text-slate-400 dark:text-white/30" />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mb-1 uppercase tracking-widest">Global Chat</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed px-4">
                            Sua caixa de entrada neural está vazia. Explore perfis para gerar conexões.
                        </p>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};