"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ChatBubbleLeftRightIcon,
    MinusIcon,
    LockClosedIcon,
    CheckIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface LoungeChatWidgetProps {
    defaultOpen?: boolean;
}

export const LoungeChatWidget = ({ defaultOpen = false }: LoungeChatWidgetProps) => {
    const { t } = useTranslation();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Estado real da API
    const [incomingRequest, setIncomingRequest] = useState<any>(null);
    const [isAccepted, setIsAccepted] = useState(false);

    // Fica checando de 5 em 5 segundos se há novos pedidos de conexão
    useEffect(() => {
        const fetchPending = async () => {
            if (!isOpen || isAccepted) return;
            try {
                const res = await fetch('/api/network/request');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setIncomingRequest({
                            id: data[0].id,
                            senderId: data[0].senderId,
                            senderName: data[0].sender?.name || "Agente",
                            senderImage: data[0].sender?.image || "",
                            message: data[0].message
                        });
                    } else {
                        setIncomingRequest(null);
                    }
                }
            } catch (error) { console.error(error); }
        };

        if (isOpen && !incomingRequest && !isAccepted) fetchPending();
        const interval = setInterval(fetchPending, 5000);
        return () => clearInterval(interval);
    }, [isOpen, incomingRequest, isAccepted]);

    const handleRespond = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!incomingRequest) return;

        try {
            await fetch('/api/network/respond', { // PATCH nativo usando nossa API combinada
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: incomingRequest.id, status })
            });

            if (status === 'ACCEPTED') {
                setIsAccepted(true);
                setTimeout(() => {
                    setIsAccepted(false);
                    setIncomingRequest(null);
                }, 5000);
            } else {
                setIncomingRequest(null);
            }
        } catch (error) {
            console.error("Erro ao responder", error);
        }
    };

    const glassStyle = `
        dark:bg-[#0f172a]/95 bg-white/90
        backdrop-blur-xl border dark:border-white/10 border-slate-200
        shadow-2xl overflow-hidden
    `;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{
                y: 0,
                opacity: 1,
                height: isOpen ? (incomingRequest ? 280 : 200) : 48,
                width: isOpen ? 340 : 180
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={`fixed bottom-0 right-8 z-50 rounded-t-2xl flex flex-col ${glassStyle}`}
        >
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="h-12 flex items-center justify-between px-4 bg-[#0f172a] dark:bg-white/5 border-b dark:border-white/5 cursor-pointer shrink-0 hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative"
            >
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className={`w-2 h-2 rounded-full ${incomingRequest && !isOpen ? 'bg-cyan-400 animate-ping absolute' : ''}`} />
                        <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-red-500' : (incomingRequest ? 'bg-cyan-500' : 'bg-emerald-500 animate-pulse')}`} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50 truncate">
                        {incomingRequest && !isOpen
                            ? "Sinal Recebido"
                            : (isOpen ? t("lounge_chat.system_restricted", "System Restricted") : t("lounge_chat.chat", "Global Chat"))}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-white/10 rounded text-slate-500 dark:text-white">
                        {isOpen ? <MinusIcon className="w-4 h-4" /> : <ChatBubbleLeftRightIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isOpen && incomingRequest ? (
                    <motion.div key="request-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col p-5 bg-slate-50/50 dark:bg-black/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                onClick={() => router.push(`/workstation/${incomingRequest.senderId}`)}
                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-500/50 cursor-pointer hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            >
                                <img src={incomingRequest.senderImage} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Pedido de Conexão</span>
                                <span
                                    onClick={() => router.push(`/workstation/${incomingRequest.senderId}`)}
                                    className="text-sm font-black text-slate-800 dark:text-white cursor-pointer hover:underline"
                                >
                                    {incomingRequest.senderName}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 mb-4">
                            <p className="text-[11px] italic text-slate-600 dark:text-white/70 leading-relaxed font-mono">
                                "{incomingRequest.message}"
                            </p>
                        </div>

                        <div className="flex gap-2 mt-auto">
                            <button onClick={() => handleRespond('REJECTED')} className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors">
                                Rejeitar
                            </button>
                            <button onClick={() => handleRespond('ACCEPTED')} className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] text-[10px] font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-1">
                                <CheckIcon className="w-3 h-3" /> Aceitar
                            </button>
                        </div>
                    </motion.div>

                ) : isOpen && isAccepted ? (
                    <motion.div key="accepted-view" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-cyan-900/20">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                            <span className="text-2xl font-black text-black">+1</span>
                        </motion.div>
                        <h4 className="text-sm font-bold text-cyan-400 mb-1">Conexão Estabelecida</h4>
                        <p className="text-[10px] text-cyan-200/60 font-mono leading-relaxed">
                            Agora vocês são colegas de rede!
                        </p>
                    </motion.div>

                ) : isOpen ? (
                    <motion.div key="locked-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-black/20">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3"><LockClosedIcon className="w-6 h-6 text-red-500" /></div>
                        <h4 className="text-sm font-bold text-[#0f172a] dark:text-white mb-1">{t("lounge_chat.access_denied", "Access Denied")}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed">Você não tem pedidos de conexão pendentes no momento.</p>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};