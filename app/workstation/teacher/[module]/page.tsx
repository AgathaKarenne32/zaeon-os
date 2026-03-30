"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Briefcase,
    Search,
    Bot,
    Coffee,
    Wallet,
    PanelLeftClose,
    PanelLeftOpen,
    Focus,
    User
} from "lucide-react";

import WorkStationContent from "@/app/workstation/WorkStationContent";

export default function TeacherWorkstation() {
    const params = useParams();
    const router = useRouter();
    const currentModule = params.module as string;

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isFocusMode, setIsFocusMode] = useState(false);

    // Efeito para recuperar o estado do Modo Foco e da Sidebar ao mudar de rota
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Recupera o Modo Foco
            const savedFocusMode = sessionStorage.getItem("zaeon-focus-mode") === "true";
            if (savedFocusMode) {
                setIsFocusMode(true);
                document.body.classList.add("focus-mode-active");
                window.dispatchEvent(new CustomEvent("zaeon-focus-mode", { detail: true }));
            }

            // Recupera o estado da Sidebar
            const savedSidebarState = sessionStorage.getItem("zaeon-sidebar-expanded");
            if (savedSidebarState !== null) {
                setIsSidebarExpanded(savedSidebarState === "true");
            }
        }
    }, []);

    // Função dedicada para alternar o Modo Foco garantindo persistência
    const toggleFocusMode = () => {
        const newMode = !isFocusMode;
        setIsFocusMode(newMode);

        if (typeof window !== "undefined") {
            sessionStorage.setItem("zaeon-focus-mode", String(newMode));
            window.dispatchEvent(new CustomEvent("zaeon-focus-mode", { detail: newMode }));

            if (newMode) {
                document.body.classList.add("focus-mode-active");
            } else {
                document.body.classList.remove("focus-mode-active");
            }
        }
    };

    // Função dedicada para alternar a Sidebar garantindo persistência
    const toggleSidebar = () => {
        const newState = !isSidebarExpanded;
        setIsSidebarExpanded(newState);

        if (typeof window !== "undefined") {
            sessionStorage.setItem("zaeon-sidebar-expanded", String(newState));
        }
    };

    const menuItems = [
        { id: "work", label: "Área de Trabalho", icon: Briefcase },
        { id: "research", label: "Área de Pesquisa", icon: Search },
        { id: "agentic", label: "Pesquisa Agêntica", icon: Bot },
        { id: "lounge", label: "Lounge", icon: Coffee },
        { id: "finances", label: "Finanças", icon: Wallet },
        { id: "profile", label: "Meu Perfil", icon: User },
    ];

    const renderModuleContent = () => {
        switch (currentModule) {
            case "work": return <div className="p-8 text-black/80 dark:text-white/80 font-medium">Carregando painel de aulas e turmas...</div>;
            case "research": return <div className="p-8 text-black/80 dark:text-white/80 font-medium">Carregando repositório de teses...</div>;
            case "agentic": return <div className="p-8 text-black/80 dark:text-white/80 font-medium">Inicializando rede de agentes (Aura, Scholar)...</div>;
            case "lounge": return <div className="p-8 text-black/80 dark:text-white/80 font-medium">Lounge dos professores em breve.</div>;
            case "finances": return <div className="p-8 text-black/80 dark:text-white/80 font-medium">Módulo financeiro de repasses...</div>;
            case "profile": return <WorkStationContent isEmbedded={true} />;
            default: return <div className="p-8 text-black/80 dark:text-white/80 font-medium">Selecione um módulo no menu lateral.</div>;
        }
    };

    return (
        <div className={`min-h-screen bg-[#f5f5f7] dark:bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200/50 dark:from-slate-900/20 via-transparent to-transparent flex transition-all duration-700 ease-in-out ${isFocusMode ? 'pt-2 fixed inset-0 z-50' : 'pt-24'}`}>

            {/* SIDEBAR - APPLE LIQUID GLASS */}
            <aside
                className={`
          relative flex flex-col justify-between m-4 rounded-[2rem]
          bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-2xl 
          border border-white/40 dark:border-white/5 
          shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]
          transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${isSidebarExpanded ? "w-64" : "w-20"}
          ${isFocusMode ? 'h-[calc(100vh-2rem)]' : 'h-[calc(100vh-7rem)]'}
        `}
            >
                {/* Efeito de Reflexo Interno (Glassmorphism highlight) */}
                <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="h-20 flex items-center justify-center border-b border-black/5 dark:border-white/5">
                        <button
                            onClick={toggleSidebar} // <-- Alterado aqui para usar a nova função
                            className="p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-white/70 hover:text-black dark:hover:text-white"
                        >
                            {isSidebarExpanded ? <PanelLeftClose size={22} strokeWidth={1.5} /> : <PanelLeftOpen size={22} strokeWidth={1.5} />}
                        </button>
                    </div>

                    <nav className="p-3 space-y-2 mt-4">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentModule === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => router.push(`/workstation/teacher/${item.id}`)}
                                    className={`
                                        w-full flex items-center p-3 rounded-2xl transition-all duration-300 group
                                        ${isActive
                                            ? "bg-black/5 dark:bg-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] text-black dark:text-white font-semibold"
                                            : "text-slate-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white/90"}
                                        ${!isSidebarExpanded && "justify-center"}
                                    `}
                                >
                                    <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "drop-shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""} />
                                    {isSidebarExpanded && (
                                        <span className="ml-4 tracking-wide text-[13px]">{item.label}</span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="relative z-10 p-3 border-t border-black/5 dark:border-white/5 mb-2">
                    <button
                        onClick={toggleFocusMode}
                        className={`
                            w-full flex items-center p-3 rounded-2xl transition-all duration-300
                            ${isFocusMode
                                ? "bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
                                : "text-slate-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"}
                            ${!isSidebarExpanded && "justify-center"}
                        `}
                        title="Modo Foco"
                    >
                        <Focus size={20} strokeWidth={isFocusMode ? 2 : 1.5} className={isFocusMode ? "animate-pulse" : ""} />
                        {isSidebarExpanded && (
                            <span className="ml-4 font-medium tracking-wide text-[13px]">Modo Foco</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* ÁREA DE CONTEÚDO PRINCIPAL */}
            <main className={`flex-1 p-4 pl-0 transition-all duration-700 ease-in-out ${isFocusMode ? 'h-[calc(100vh-1rem)]' : 'h-[calc(100vh-6rem)]'}`}>
                <div className="w-full h-full rounded-[2rem] bg-white/50 dark:bg-[#121212]/40 backdrop-blur-3xl border border-white/40 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col relative">

                    {/* Linha de reflexo no topo do vidro */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-black/5 dark:via-white/10 to-transparent"></div>

                    <header className="h-20 flex items-center px-8 border-b border-black/5 dark:border-white/5">
                        <h1 className="text-lg font-semibold text-slate-800 dark:text-white/90 tracking-wide capitalize">
                            {menuItems.find(i => i.id === currentModule)?.label || "Workstation"}
                        </h1>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {renderModuleContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}