"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ChevronRightIcon, UserGroupIcon, BeakerIcon,
    CpuChipIcon, ShieldCheckIcon, SparklesIcon,
    ArrowPathIcon, ChartBarIcon, BookOpenIcon,
    CameraIcon, PencilSquareIcon, EyeIcon,
    HandRaisedIcon, LockClosedIcon,
    AcademicCapIcon, UserGroupIcon as CollabIcon
} from "@heroicons/react/24/outline";
import MatrixRain from "@/components/main/star-background";

// --- MAPEAMENTO DE CURSOS PARA SALAS ---
const ROOM_MAPPING: Record<string, string[]> = {
    cyber: ["Ciência da Computação", "Engenharia de Software", "Sistemas de Informação", "Análise e Desenvolvimento de Sistemas", "Engenharia da Computação", "Redes de Computadores", "Segurança da Informação / Cibersegurança", "Banco de Dados", "Inteligência Artificial", "Ciência de Dados", "Computação em Nuvem", "Internet das Coisas", "Robótica", "Jogos Digitais", "Design Digital / UX / UI", "Computer Science", "Software Engineering"],
    med: ["Medicina", "Enfermagem", "Odontologia", "Farmácia", "Fisioterapia", "Nutrição", "Psicologia", "Fonoaudiologia", "Terapia Ocupacional", "Biomedicina", "Educação Física"],
    bio: ["Ciências Biológicas", "Biologia", "Biotecnologia", "Bioquímica", "Bioinformática", "Ecologia"],
    quantic: ["Matemática", "Matemática Aplicada", "Estatística", "Física", "Astronomia", "Astrofísica", "Geofísica", "Meteorologia"],
    humanities: ["História", "Geografia", "Filosofia", "Sociologia", "Antropologia", "Ciência Política", "Relações Internacionais", "Letras", "Linguística", "Pedagogia", "Artes", "Música", "Teatro", "Dança", "Cinema e Audiovisual", "Arquivologia", "Biblioteconomia", "Museologia", "Serviço Social", "Comunicação Social", "Jornalismo", "Publicidade e Propaganda", "Editoração", "Produção Cultural", "Direito", "Teologia"]
};

const ROOM_DETAILS = {
    cyber: { id: "cyber", name: "Cyber Room", icon: CpuChipIcon, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-300 dark:border-cyan-500/30", route: "/study-rooms/cyber" },
    med: { id: "med", name: "MedLab", icon: ChartBarIcon, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-300 dark:border-rose-500/30", route: "/study-rooms/med" },
    bio: { id: "bio", name: "Bio Room", icon: BeakerIcon, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-300 dark:border-emerald-500/30", route: "/study-rooms/bio" },
    quantic: { id: "quantic", name: "Quantic Room", icon: SparklesIcon, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-300 dark:border-blue-500/30", route: "/study-rooms/quantic" },
    humanities: { id: "humanities", name: "Grand Archive", icon: BookOpenIcon, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-300 dark:border-amber-500/30", route: "/study-rooms/humanities" },
};

// --- ÁRVORE DE HABILIDADES GAMIFICADA (RANKS F -> SS) ---
const UNIVERSAL_SKILLS = [
    { id: "writing", name: "Academic Writing", icon: PencilSquareIcon, color: "text-purple-500", rank: "C", current: 4, next: 5, metricName: "Papers", locked: false },
    { id: "focus", name: "Deep Focus", icon: EyeIcon, color: "text-cyan-500", rank: "E", current: 15, next: 50, metricName: "Hours", locked: false },
    { id: "collab", name: "Collective Synergy", icon: CollabIcon, color: "text-blue-500", rank: "D", current: 4, next: 10, metricName: "Projects", locked: false },
    { id: "participation", name: "Participation", icon: HandRaisedIcon, color: "text-emerald-500", rank: "F", current: 0, next: 5, metricName: "Validations", locked: true, note: "Teacher Controlled" }
];

// --- COMPONENTE: GAVETA DE HABILIDADE ---
const SkillDrawer = ({ skill, isOpen, onToggle }: any) => {
    const progressPercent = Math.min((skill.current / skill.next) * 100, 100);
    return (
        <div className="relative z-40 group/drawer flex items-center">
            <div className="w-6 h-[2px] bg-slate-400/50 dark:bg-cyan-500/30" />
            <motion.button onClick={onToggle} className={`relative w-9 h-9 flex items-center justify-center border rounded-full transition-all z-50 shadow-md bg-white/80 dark:bg-[#0a0a0a] backdrop-blur-md hover:scale-110 ${skill.locked ? 'border-slate-300 dark:border-white/10 opacity-70' : 'border-slate-400 dark:border-cyan-500/50'}`}>
                <skill.icon className={`w-4 h-4 ${skill.locked ? 'text-slate-400' : skill.color}`} />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ x: -20, opacity: 0, scale: 0.8 }} animate={{ x: 10, opacity: 1, scale: 1 }} exit={{ x: -10, opacity: 0, scale: 0.8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="absolute left-full ml-2 w-56 bg-white/90 dark:bg-[#0a0a0a]/95 border border-slate-300 dark:border-cyan-500/30 p-4 rounded-2xl shadow-xl backdrop-blur-2xl z-50">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${skill.color}`}>{skill.name}</span>
                                <span className="text-xs font-black text-slate-800 dark:text-white mt-1">Rank {skill.rank}</span>
                            </div>
                            {skill.locked && <LockClosedIcon className="w-4 h-4 text-slate-400" title="Only teachers can inject XP" />}
                        </div>
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-white/40 tracking-widest">Progress</span>
                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-white/80">{skill.current} / {skill.next} <span className="text-[8px] uppercase">{skill.metricName}</span></span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className={`h-full ${skill.locked ? 'bg-emerald-500/50' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]'}`} />
                        </div>
                        {skill.locked && <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-2 uppercase tracking-widest font-bold">{skill.note}</p>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- COMPONENTE: DNA 3D AVANÇADO ---
const RealisticDNA = () => (
    <motion.div animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.98, 1.02, 0.98] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 flex flex-col items-center justify-around py-12 pointer-events-none z-10 mix-blend-multiply dark:mix-blend-screen" style={{ perspective: "1000px" }}>
        {[...Array(22)].map((_, i) => (
            <motion.div key={i} className="relative w-16 h-[2px] flex items-center justify-between" animate={{ rotateY: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: i * 0.15 }}>
                <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-indigo-500 shadow-[0_0_10px_#4f46e5]" />
                <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-cyan-500/50 dark:from-indigo-500/50 dark:to-cyan-400/50" />
                <div className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
            </motion.div>
        ))}
    </motion.div>
);

export default function WorkStationPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeSkill, setActiveSkill] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false); // Estado novo para controlar o loading do upload

    // --- LEITURA DA CHAVE MESTRA (ADMIN) ---
    // @ts-ignore
    const isSuperAdmin = !!session?.user?.isAdmin;

    const userCourse = (session?.user as any)?.course || "";
    const kycStatus = (session?.user as any)?.kycStatus || "pending";
    const academicLevel = (session?.user as any)?.academicLevel || "Graduação";
    const [userImage, setUserImage] = useState(session?.user?.image || "/assets/default-avatar.png");

    const getTargetRoom = () => {
        if (kycStatus === "rejected") return null;
        for (const [room, courses] of Object.entries(ROOM_MAPPING)) {
            if (courses.includes(userCourse)) return room as keyof typeof ROOM_DETAILS;
        }
        return null;
    };

    const targetRoomKey = getTargetRoom();
    const targetRoom = targetRoomKey ? ROOM_DETAILS[targetRoomKey] : null;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const syncOnboardingData = async () => {
            const savedData = localStorage.getItem('zaeon_onboarding');
            if (savedData && status === "authenticated") {
                setIsSyncing(true);
                try {
                    const onboardingPayload = JSON.parse(savedData);
                    const res = await fetch('/api/auth/onboarding', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(onboardingPayload)
                    });
                    if (res.ok) {
                        localStorage.removeItem('zaeon_onboarding');
                        await update();
                    }
                } catch (error) { console.error(error); }
                finally { setIsSyncing(false); }
            }
        };
        if (mounted) syncOnboardingData();
    }, [mounted, status, update]);

    // --- Sincronizador de Imagem: Garante que a tela sempre reflita o banco de dados ---
    useEffect(() => {
        if (session?.user?.image) {
            setUserImage(session.user.image);
        }
    }, [session?.user?.image]);

    // --- Compressor e Sincronizador de Upload ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 400; // Tamanho ideal para avatares
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
                setUserImage(compressedBase64); // Atualiza visualmente na hora

                try {
                    const res = await fetch('/api/user/avatar', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: compressedBase64 })
                    });

                    if (res.ok) {
                        // Sincroniza com o NextAuth e o banco
                        await update({ image: compressedBase64 });
                    } else {
                        const err = await res.json();
                        alert("Falha ao salvar no banco: " + err.error);
                    }
                } catch (error) {
                    console.error("Erro na API:", error);
                    alert("Erro de conexão ao salvar a imagem.");
                } finally {
                    setIsUploading(false);
                }
            };
        };
    };

    if (!mounted || status === "loading" || isSyncing) {
        return (
            <div className="w-full h-screen bg-slate-100/50 dark:bg-[#030014] flex flex-col items-center justify-center z-[999]">
                <ArrowPathIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-500 animate-spin mb-4" />
                <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-500 uppercase tracking-[0.3em] animate-pulse">
                    {isSyncing ? "Neural Sync in Progress..." : "Loading Workstation..."}
                </span>
            </div>
        );
    }

    if (status === "unauthenticated") { router.replace("/"); return null; }

    const cardBaseStyle = "relative overflow-hidden backdrop-blur-2xl transition-all duration-500 border shadow-xl flex flex-col cursor-pointer group shrink-0";

    return (
        <div className="w-full h-screen bg-slate-200/30 dark:bg-[#030014] overflow-hidden relative flex items-center justify-center transition-colors duration-1000 text-slate-800 dark:text-white font-mono">
            <div className="absolute inset-0 z-0 opacity-40 dark:opacity-100 pointer-events-none"><MatrixRain /></div>

            <div className="z-20 w-full max-w-[1400px] h-[85vh] grid grid-cols-1 lg:grid-cols-12 gap-12 relative px-8 mt-16">

                {/* --- LADO ESQUERDO: HUD DO PERSONAGEM --- */}
                <div className="lg:col-span-6 h-full relative flex items-center justify-start pl-4 lg:pl-10">
                    <div className="relative flex items-center h-[85%]">
                        <div className="relative w-[180px] h-full rounded-[100px] border-[3px] border-white/60 dark:border-white/10 bg-white/30 dark:bg-cyan-900/10 backdrop-blur-md shadow-[0_0_50px_rgba(34,211,238,0.15)] dark:shadow-[0_0_40px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center z-20">
                            <RealisticDNA />
                            <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative z-30">
                                <label className={`relative block w-28 h-28 rounded-full border-4 border-cyan-500/80 dark:border-cyan-400 p-1 bg-white dark:bg-black shadow-[0_0_30px_rgba(34,211,238,0.4)] cursor-pointer group/avatar ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    <Image src={userImage} alt="Avatar" fill className="object-cover rounded-full" />
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                        {isUploading ? <ArrowPathIcon className="w-6 h-6 text-white animate-spin mb-1" /> : <CameraIcon className="w-8 h-8 text-white mb-1" />}
                                        <span className="text-[7px] uppercase font-bold text-white tracking-widest">{isUploading ? 'Saving...' : 'Change'}</span>
                                    </div>
                                </label>
                            </motion.div>
                            <div className="absolute bottom-10 z-30 flex flex-col items-center bg-white/70 dark:bg-black/50 border border-white/50 dark:border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl shadow-lg">
                                <span className="text-[9px] uppercase font-black tracking-widest text-cyan-600 dark:text-cyan-400">{isSuperAdmin ? "Root Admin" : "Subject Node"}</span>
                                <span className="text-sm font-bold truncate max-w-[120px] text-slate-900 dark:text-white">{session?.user?.name}</span>
                            </div>
                        </div>

                        <div className="absolute left-[100%] flex flex-col gap-6 z-10">
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="relative flex items-center">
                                <div className="w-6 h-[2px] bg-slate-400/50 dark:bg-cyan-500/50" />
                                <div className="bg-white/80 dark:bg-[#0a0a0a]/90 border border-white/60 dark:border-cyan-500/30 px-5 py-3 rounded-2xl backdrop-blur-xl shadow-xl flex items-center gap-3">
                                    <AcademicCapIcon className={`w-6 h-6 ${isSuperAdmin ? 'text-yellow-500' : 'text-emerald-600 dark:text-cyan-400'}`} />
                                    <div>
                                        <div className="text-[8px] text-slate-500 dark:text-cyan-500/70 uppercase font-black tracking-widest">Level</div>
                                        <div className="text-xs font-bold uppercase text-slate-900 dark:text-white">{isSuperAdmin ? "Architect (Max)" : academicLevel}</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="relative flex flex-col items-start mt-4">
                                <div className="flex items-center">
                                    <div className="w-10 h-[2px] bg-slate-400/50 dark:bg-cyan-500/50" />
                                    <div className="bg-white/80 dark:bg-[#0a0a0a]/90 border border-white/60 dark:border-cyan-500/30 px-5 py-3 rounded-2xl backdrop-blur-xl shadow-xl flex items-center gap-3 relative z-20">
                                        <BookOpenIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                        <div>
                                            <div className="text-[8px] text-slate-500 dark:text-cyan-500/70 uppercase font-black tracking-widest">Knowledge Base</div>
                                            <div className="text-xs font-bold uppercase truncate max-w-[180px] text-slate-900 dark:text-white">{isSuperAdmin ? "Omniscient" : userCourse || "Undeclared"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 mt-4 ml-16 relative z-10 border-l-[2px] border-slate-300 dark:border-cyan-500/30 pl-4 py-2">
                                    {UNIVERSAL_SKILLS.map((skill) => (
                                        <SkillDrawer key={skill.id} skill={skill} isOpen={activeSkill === skill.id} onToggle={() => setActiveSkill(activeSkill === skill.id ? null : skill.id)} />
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* --- LADO DIREITO: PORTAS DE ACESSO --- */}
                <div className="lg:col-span-6 flex flex-col justify-start items-start gap-5 z-30 max-w-[480px] ml-auto w-full h-[80vh] pt-4">

                    <div className="mb-2 shrink-0">
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 text-slate-900 dark:text-white drop-shadow-md">Workspace</h1>
                        <p className="text-[11px] text-slate-600 dark:text-white/50 font-mono tracking-widest uppercase flex items-center gap-2">
                            Select destination protocol.
                            {isSuperAdmin && <span className="text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">ROOT ACCESS</span>}
                        </p>
                    </div>

                    {/* Container com scroll para caber todas as salas do Admin */}
                    <div className="w-full flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2 pb-10">

                        <div onClick={() => router.push('/study-rooms/lounge')} className={`${cardBaseStyle} w-full bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-500/50 p-6 rounded-[32px]`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/60 dark:bg-white/10 rounded-2xl shadow-sm"><UserGroupIcon className="w-6 h-6 text-slate-800 dark:text-white" /></div>
                                    <div>
                                        <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">Lounge & Network</h2>
                                        <p className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-bold">General Access</p>
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-6 h-6 text-slate-400 dark:text-white/30 group-hover:text-cyan-500 group-hover:translate-x-2 transition-all" />
                            </div>
                            <p className="text-sm text-slate-700 dark:text-white/60 leading-relaxed font-sans">
                                Área de convivência global. Conecte-se com alunos e inicie projetos colaborativos.
                            </p>
                        </div>

                        {/* RENDERIZAÇÃO CONDICIONAL DA MASTER KEY */}
                        {isSuperAdmin ? (
                            // Renderiza TODAS as salas se for Admin
                            Object.values(ROOM_DETAILS).map((room) => (
                                <div key={room.id} onClick={() => router.push(room.route)} className={`${cardBaseStyle} w-full bg-white/50 dark:${room.bg} border-yellow-400/50 hover:border-yellow-400 p-6 rounded-[32px]`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 bg-white/80 dark:bg-black/40 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm`}>
                                                <room.icon className={`w-6 h-6 ${room.color}`} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">{room.name}</h2>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className={`text-[10px] ${room.color} uppercase tracking-widest font-bold`}>Specialized Lab</p>
                                                    <span className="text-[8px] font-black uppercase text-yellow-600 dark:text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full bg-yellow-400/10">Admin Override</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRightIcon className={`w-6 h-6 text-yellow-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all`} />
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-white/60 leading-relaxed font-sans">
                                        Acesso desbloqueado via Master Key. Circulação livre autorizada.
                                    </p>
                                </div>
                            ))
                        ) : targetRoom ? (
                            // Renderiza APENAS a sala do curso se for um usuário normal
                            <div onClick={() => router.push(targetRoom.route)} className={`${cardBaseStyle} w-full bg-white/50 dark:${targetRoom.bg} border-white/60 dark:${targetRoom.border} hover:border-${targetRoom.color.split('-')[1]}-400 p-6 rounded-[32px]`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 bg-white/80 dark:bg-black/40 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm`}><targetRoom.icon className={`w-6 h-6 ${targetRoom.color}`} /></div>
                                        <div>
                                            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">{targetRoom.name}</h2>
                                            <p className={`text-[10px] ${targetRoom.color} uppercase tracking-widest font-bold`}>Specialized Lab</p>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className={`w-6 h-6 ${targetRoom.color} opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all`} />
                                </div>
                                <p className="text-sm text-slate-700 dark:text-white/60 leading-relaxed font-sans">
                                    Laboratório restrito aprovado para <span className="font-bold text-slate-900 dark:text-white">{userCourse}</span>.
                                </p>
                            </div>
                        ) : (
                            // Renderiza a caixa de bloqueio caso não tenha KYC ou curso mapeado
                            <div className="w-full p-6 rounded-[32px] border border-red-300 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/5 backdrop-blur-xl shadow-lg shrink-0">
                                <h2 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5" /> Acesso Restrito
                                </h2>
                                <p className="text-xs text-slate-700 dark:text-white/60 leading-relaxed font-sans">
                                    Seu perfil atual não concede acesso aos laboratórios especializados.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.5); }
            `}</style>
        </div>
    );
}