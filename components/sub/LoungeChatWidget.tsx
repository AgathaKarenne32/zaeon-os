"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import PusherClient from "pusher-js"; // 🔥 IMPORT DO PUSHER AQUI 🔥
import {
    ChatBubbleLeftRightIcon,
    MinusIcon,
    CheckIcon,
    XMarkIcon,
    UserIcon,
    ChevronLeftIcon,
    PaperAirplaneIcon,
    BellAlertIcon,
    UsersIcon
} from "@heroicons/react/24/outline";

interface LoungeChatWidgetProps {
    defaultOpen?: boolean;
}

export const LoungeChatWidget = ({ defaultOpen = false }: LoungeChatWidgetProps) => {
    const router = useRouter();
    const { data: session } = useSession();
    // @ts-ignore
    const fallbackId = session?.user?.id || "";

    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [messageInput, setMessageInput] = useState("");

    // O seu ID real que o Pusher vai usar para criar o canal
    const [realUserId, setRealUserId] = useState<string>(fallbackId);

    // Estados da API & Notificações
    const [incomingRequest, setIncomingRequest] = useState<any>(null);
    const [friends, setFriends] = useState<any[]>([]);
    const [chatHistory, setChatHistory] = useState<any[]>([]);

    const activeChatRef = useRef(activeChat);
    const [unreadCount, setUnreadCount] = useState(0);
    const [flash, setFlash] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        activeChatRef.current = activeChat;
        if (isOpen) setUnreadCount(0);
    }, [activeChat, isOpen]);

    useEffect(() => {
        if (isOpen && activeChat) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory, isOpen, activeChat]);

    // 🔥 1. INICIALIZAÇÃO DO PUSHER (WEB SOCKET GERENCIADO) 🔥
    useEffect(() => {
        if (!realUserId) return;

        // Inicia o cliente do Pusher usando as variáveis de ambiente
        const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        // Assina o canal exclusivo do usuário atual
        const channel = pusher.subscribe(`user_${realUserId}`);

        // Fica escutando por mensagens disparadas pela API
        channel.bind('new-message', (newMessage: any) => {
            if (activeChatRef.current?.id === newMessage.senderId) {
                // Se for de quem estamos conversando, joga na tela
                setChatHistory(prev => {
                    if (prev.find(msg => msg.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            } else {
                // Notificação de background (Flash e +1)
                setUnreadCount(prev => prev + 1);
                setFlash(true);
                setTimeout(() => setFlash(false), 1500);
            }
        });

        return () => {
            pusher.unsubscribe(`user_${realUserId}`);
            pusher.disconnect();
        };
    }, [realUserId]);

    // 🔥 2. BUSCA DE COLEGAS E DO SEU ID REAL
    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await fetch(`/api/network/friends?t=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.myId) setRealUserId(data.myId);
                    setFriends(data.friends || []);
                }
            } catch (error) { console.error("Erro ao buscar amigos:", error); }
        };

        if ((isOpen && activeTab === 'friends' && !activeChat) || !realUserId) {
            fetchFriends();
        }
    }, [isOpen, activeTab, activeChat, realUserId]);

    // 3. RADAR DE PEDIDOS (Polling leve a cada 10s)
    useEffect(() => {
        const fetchNetworkActivity = async () => {
            try {
                const resIn = await fetch(`/api/network/request?t=${Date.now()}`, { cache: 'no-store' });
                if (resIn.ok) {
                    const dataIn = await resIn.json();
                    if (dataIn && dataIn.length > 0) {
                        if (!incomingRequest) {
                            setFlash(true);
                            setTimeout(() => setFlash(false), 1500);
                        }
                        setIncomingRequest({
                            id: dataIn[0].id,
                            senderId: dataIn[0].senderId,
                            senderName: dataIn[0].sender?.name || "Agente",
                            senderImage: dataIn[0].sender?.image || "",
                            message: dataIn[0].message
                        });
                        if (!activeChat && isOpen) setActiveTab('requests');
                    } else {
                        setIncomingRequest(null);
                    }
                }
            } catch (error) { console.error(error); }
        };

        fetchNetworkActivity();
        const interval = setInterval(fetchNetworkActivity, 10000);
        return () => clearInterval(interval);
    }, [activeChat, isOpen, incomingRequest]);

    // 4. BUSCA INICIAL DE MENSAGENS E FALLBACK
    useEffect(() => {
        if (!isOpen || !activeChat) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/chat/messages?targetId=${activeChat.id}&t=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setChatHistory(data);
                }
            } catch (error) { console.error(error); }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [isOpen, activeChat]);


    // 🔥 5. FUNÇÃO DE ENVIAR MENSAGEM 🔥
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !activeChat) return;
        const text = messageInput.trim();
        setMessageInput("");

        // Joga a mensagem na tela imediatamente (Optimistic UI)
        const optimisticMsg = {
            id: `opt_${Date.now()}`,
            senderId: realUserId,
            text: text,
        };

        setChatHistory(prev => [...prev, optimisticMsg]);

        // A API vai cuidar de salvar e avisar o Pusher para disparar no outro cliente
        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: activeChat.id, text })
            });
        } catch (error) { console.error(error); }
    };


    const handleRespondRequest = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!incomingRequest) return;
        try {
            await fetch('/api/network/respond', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: incomingRequest.id, status })
            });
            setIncomingRequest(null);
            if (status === 'ACCEPTED') setActiveTab('friends');
        } catch (error) { console.error(error); }
    };

    const glassContainer = `
        backdrop-blur-3xl bg-white/95 dark:bg-[#0f172a]/80 
        border border-slate-300 dark:border-white/10 
        shadow-[0_0_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]
    `;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{
                y: 0,
                opacity: 1,
                height: isOpen ? 450 : 48,
                width: isOpen ? 320 : 200
            }}
            transition={{ type: "spring", stiffness: 150, damping: 25 }}
            className={`fixed bottom-0 right-4 sm:right-8 z-[999] rounded-t-3xl flex flex-col overflow-hidden ${glassContainer}`}
        >
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`h-12 flex items-center justify-between px-5 cursor-pointer shrink-0 transition-all border-b border-slate-200 dark:border-white/5 ${flash
                    ? "bg-cyan-500/30 dark:bg-cyan-500/40 shadow-[inset_0_0_20px_rgba(6,182,212,0.5)]"
                    : "bg-white/50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
            >
                <div className="flex items-center gap-3 relative">
                    <AnimatePresence>
                        {unreadCount > 0 && !isOpen && (
                            <motion.div
                                initial={{ scale: 0, y: 10, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-3 -left-2 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-50"
                            >
                                +{unreadCount}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10">
                        {((incomingRequest || unreadCount > 0) && !isOpen) && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        )}
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                        {isOpen ? (activeChat ? activeChat.name : "Rede Neural") : "Chat"}
                    </span>
                </div>

                {isOpen ? (
                    <button className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                        <MinusIcon className="w-5 h-5" />
                    </button>
                ) : (incomingRequest || unreadCount > 0) ? (
                    <BellAlertIcon className="w-5 h-5 text-red-500 animate-pulse" />
                ) : null}
            </div>

            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        key={activeChat ? "chat" : "menu"}
                        initial={{ opacity: 0, x: activeChat ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: activeChat ? -20 : 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col overflow-hidden relative"
                    >
                        {activeChat ? (
                            <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-black/10">
                                <div className="flex items-center gap-3 p-3 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                                    <button onClick={() => setActiveChat(null)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                        <ChevronLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-white/20 bg-slate-200 dark:bg-black shrink-0">
                                        {activeChat.image ? (
                                            <Image src={activeChat.image} alt={activeChat.name} fill sizes="32px" className="object-cover" />
                                        ) : (
                                            <UserIcon className="w-full h-full p-1.5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{activeChat.name}</span>
                                        <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-medium">Chat Seguro</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                                    {chatHistory.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                                            <ChatBubbleLeftRightIcon className="w-8 h-8 text-slate-400 mb-2" />
                                            <span className="text-[10px] text-slate-500 font-mono italic">A conexão foi iniciada.</span>
                                        </div>
                                    )}
                                    {chatHistory.map((msg: any) => {
                                        const isMe = msg.senderId !== activeChat.id;
                                        return (
                                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                                    {!isMe && (
                                                        <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-black">
                                                            {activeChat.image ? (
                                                                <Image src={activeChat.image} alt={activeChat.name} fill sizes="24px" className="object-cover" />
                                                            ) : (
                                                                <UserIcon className="w-full h-full p-1 text-slate-400" />
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`p-2.5 text-[11px] shadow-sm backdrop-blur-md ${isMe ? 'bg-cyan-500 text-white rounded-2xl rounded-br-sm' : 'bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-2xl rounded-bl-sm'}`}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-3 bg-white/70 dark:bg-black/30 backdrop-blur-xl border-t border-slate-200 dark:border-white/5">
                                    <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] rounded-full border border-slate-300 dark:border-white/10 p-1 pl-4 shadow-inner">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Transmita algo..."
                                            className="flex-1 bg-transparent text-[11px] focus:outline-none text-slate-700 dark:text-white placeholder:text-slate-400"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim()}
                                            className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center text-white transition-colors shadow-md shrink-0"
                                        >
                                            <PaperAirplaneIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        ) : (
                            <div className="flex-1 flex flex-col h-full bg-white/40 dark:bg-transparent">
                                <div className="flex p-2 bg-slate-100/50 dark:bg-black/20 gap-2 border-b border-slate-200 dark:border-white/5">
                                    <button
                                        onClick={() => setActiveTab('friends')}
                                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'friends' ? 'bg-white dark:bg-[#1e293b] text-cyan-600 dark:text-cyan-400 shadow-md border border-slate-200 dark:border-transparent' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                    >
                                        Colegas
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('requests')}
                                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative ${activeTab === 'requests' ? 'bg-white dark:bg-[#1e293b] text-cyan-600 dark:text-cyan-400 shadow-md border border-slate-200 dark:border-transparent' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            Pedidos
                                            {incomingRequest && <span className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full" />}
                                        </div>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">

                                    {activeTab === 'friends' && (
                                        <div className="flex flex-col gap-1">
                                            {friends.length > 0 ? (
                                                friends.map(friend => (
                                                    <div
                                                        key={friend.id}
                                                        onClick={() => setActiveChat(friend)}
                                                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-full border border-slate-300 dark:border-white/10 shadow-sm overflow-hidden bg-slate-200 dark:bg-black shrink-0">
                                                            {friend.image ? (
                                                                <Image src={friend.image} alt={friend.name} fill sizes="40px" className="object-cover" />
                                                            ) : (
                                                                <UserIcon className="w-full h-full p-2 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">{friend.name}</span>
                                                            <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">Conectado na Rede</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-6 mt-4 text-center opacity-60">
                                                    <UsersIcon className="w-8 h-8 text-slate-400 mb-2" />
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                        Você ainda não possui conexões.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'requests' && (
                                        <div className="flex flex-col gap-2 p-2">
                                            {incomingRequest ? (
                                                <div className="flex flex-col p-4 bg-white dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-cyan-400 bg-slate-200 dark:bg-black shrink-0">
                                                            {incomingRequest.senderImage ? (
                                                                <Image src={incomingRequest.senderImage} alt="Profile" fill sizes="40px" className="object-cover" />
                                                            ) : (
                                                                <UserIcon className="w-full h-full p-2 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-widest truncate">Quer conectar</span>
                                                            <span className="text-xs font-black text-slate-800 dark:text-white truncate">{incomingRequest.senderName}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] italic text-slate-600 dark:text-white/60 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-transparent p-2 rounded-lg mb-3">
                                                        &quot;{incomingRequest.message}&quot;
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRespondRequest('REJECTED')} className="flex-1 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-600 text-[9px] font-bold uppercase transition-colors border border-red-100 dark:border-transparent">
                                                            Recusar
                                                        </button>
                                                        <button onClick={() => handleRespondRequest('ACCEPTED')} className="flex-1 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-black shadow-md text-[9px] font-bold uppercase transition-colors">
                                                            Aceitar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-6 mt-4 text-center opacity-60">
                                                    <BellAlertIcon className="w-8 h-8 text-slate-400 mb-2" />
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Nenhum pedido pendente.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
            `}</style>
        </motion.div>
    );
};