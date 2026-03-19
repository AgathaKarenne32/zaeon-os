"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ChevronRightIcon, BeakerIcon, CpuChipIcon, SparklesIcon,
    ArrowPathIcon, ChartBarIcon, BookOpenIcon,
    EyeIcon, LockClosedIcon, AcademicCapIcon, PencilSquareIcon, UserGroupIcon as CollabIcon, HandRaisedIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import MatrixRain from "@/components/main/star-background";
import NetworkMural from "@/app/workstation/profiles/NetworkMural";

// --- MAPEAMENTO DE CURSOS E SALAS ---
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

const DEFAULT_SKILLS = [
    { id: "writing", name: "Academic Writing", icon: PencilSquareIcon, rank: "F", current: 0, next: 50, metricName: "Papers", locked: false },
    { id: "focus", name: "Deep Focus", icon: EyeIcon, rank: "F", current: 0, next: 50, metricName: "Hours", locked: false },
    { id: "collab", name: "Collective Synergy", icon: CollabIcon, rank: "F", current: 0, next: 10, metricName: "Projects", locked: false },
    { id: "participation", name: "Participation", icon: HandRaisedIcon, rank: "F", current: 0, next: 5, metricName: "Validations", locked: true, note: "Teacher Controlled" }
];

const AnimatedBlueGlobe = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="w-10 h-10 rounded-full bg-blue-900/40 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)] shrink-0">
        <div className="w-5 h-5 rounded-full bg-blue-600/60 flex items-center justify-center">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 bg-cyan-300 rounded-full" />
        </div>
    </motion.div>
);

const MiniAnimatedDNA = ({ theme }: { theme: any }) => (
    <motion.div animate={{ opacity: [0.8, 1, 0.8], scale: [0.98, 1.02, 0.98] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-10 h-12 flex flex-col items-center justify-around z-10 shrink-0" style={{ perspective: "1000px" }}>
        {[...Array(4)].map((_, i) => (
            <motion.div key={i} className="relative w-8 h-[2px] flex items-center justify-between" animate={{ rotateY: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: i * 0.15 }}>
                <div className={`w-1.5 h-1.5 rounded-full ${theme.dnaColor1}`} />
                <div className={`flex-1 h-[1.5px] bg-gradient-to-r ${theme.dnaGradient}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${theme.dnaColor2}`} />
            </motion.div>
        ))}
    </motion.div>
);

const RealisticDNA = ({ theme }: { theme: any }) => (
    <motion.div animate={{ opacity: [0.8, 1, 0.8], scale: [0.98, 1.02, 0.98] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 flex flex-col items-center justify-around py-4 z-10" style={{ perspective: "1000px" }}>
        {[...Array(30)].map((_, i) => (
            <motion.div key={i} className="relative w-16 h-[3px] flex items-center justify-between" animate={{ rotateY: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: i * 0.15 }}>
                <div className={`w-3 h-3 rounded-full ${theme.dnaColor1}`} />
                <div className={`flex-1 h-[2px] bg-gradient-to-r ${theme.dnaGradient}`} />
                <div className={`w-3 h-3 rounded-full ${theme.dnaColor2}`} />
            </motion.div>
        ))}
    </motion.div>
);

const SkillDrawer = ({ skill, isOpen, onToggle, theme }: any) => {
    const progressPercent = Math.min((skill.current / skill.next) * 100, 100);
    return (
        <div className="relative z-40 group/drawer flex items-center">
            <div className={`w-6 h-[2px] ${theme.accentMuted}`} />
            <motion.button onClick={onToggle} className={`relative w-9 h-9 flex items-center justify-center border rounded-full transition-all z-50 shadow-md backdrop-blur-md hover:scale-110 ${skill.locked ? `border-white/20 opacity-70 ${theme.cardBg}` : `${theme.cardBorder} ${theme.cardBg}`}`}>
                <skill.icon className={`w-4 h-4 ${skill.locked ? 'text-slate-400' : theme.skillIconFill}`} />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ x: -20, opacity: 0, scale: 0.8 }} animate={{ x: 10, opacity: 1, scale: 1 }} exit={{ x: -10, opacity: 0, scale: 0.8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={`absolute left-full ml-2 w-56 border p-4 rounded-2xl shadow-xl backdrop-blur-2xl z-50 ${theme.cardBg} ${theme.cardBorder}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.skillTitle}`}>{skill.name}</span>
                                <span className={`text-xs font-black mt-1 ${theme.textStrong}`}>Rank {skill.rank}</span>
                            </div>
                            {skill.locked && <LockClosedIcon className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-white/40 tracking-widest">Progress</span>
                            <span className={`text-[10px] font-mono font-bold ${theme.textStrong}`}>{skill.current} / {skill.next} <span className="text-[8px] uppercase">{skill.metricName}</span></span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className={`h-full ${skill.locked ? 'bg-emerald-500/50' : `${theme.skillFill} shadow-[0_0_10px_rgba(255,255,255,0.4)]`}`} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function VisitedWorkStationPage({ params }: { params: { id: string } }) {
    const { status } = useSession();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    
    // Dados do Usuário Visitado
    const [visitedUser, setVisitedUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSkill, setActiveSkill] = useState<string | null>(null);

    const visitedUserId = params.id;

    useEffect(() => { setMounted(true); }, []);

    // Buscar os dados do usuário pela API que acabamos de criar
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch(`/api/user/profile/${visitedUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setVisitedUser(data);
                } else {
                    router.push('/workstation'); // Se o usuário não existir, volta pra própria página
                }
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (status === "authenticated") fetchUserData();
    }, [visitedUserId, status, router]);

    if (!mounted || status === "loading" || isLoading) {
        return (
            <div className={`w-full h-screen flex flex-col items-center justify-center z-[999] bg-[#030014]`}>
                <ArrowPathIcon className={`w-8 h-8 animate-spin mb-4 text-cyan-400`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-cyan-400`}>
                    Conectando ao Agente...
                </span>
            </div>
        );
    }

    if (status === "unauthenticated") { router.replace("/"); return null; }
    if (!visitedUser) return null;

    const userCourse = visitedUser.course || "";
    const academicLevel = visitedUser.academicLevel || "Graduação";
    const userGender = visitedUser.gender || "unspecified";
    const userImage = visitedUser.image || "/assets/default-avatar.png";

    const getTargetRoom = () => {
        if (visitedUser.kycStatus === "rejected") return null;
        for (const [room, courses] of Object.entries(ROOM_MAPPING)) {
            if (courses.includes(userCourse)) return room as keyof typeof ROOM_DETAILS;
        }
        return null;
    };

    const targetRoomKey = getTargetRoom();
    const targetRoom = targetRoomKey ? ROOM_DETAILS[targetRoomKey] : null;

    // Aplica o tema baseado no gênero DO USUÁRIO VISITADO
    const getTheme = () => {
        const isFemale = userGender.toLowerCase() === "feminino" || userGender.toLowerCase() === "female";
        const isMale = userGender.toLowerCase() === "masculino" || userGender.toLowerCase() === "male";
        const isLGBT = userGender.toLowerCase() === "lgbtqi+";

        if (isFemale) {
            return {
                pageBg: "bg-pink-50/80 dark:bg-[#1a0a13]", matrixOpacity: "opacity-40", capsuleBorder: "border-pink-500/20",
                capsuleIconFill: "text-blue-600 dark:text-cyan-400", cardBg: "bg-white/10 dark:bg-pink-900/5",
                cardBorder: "border-pink-200/50 dark:border-pink-500/20", panelWrapper: "bg-pink-950/20 backdrop-blur-2xl border border-pink-500/20",
                highlightCard: "border-pink-500/30 bg-pink-950/20 hover:bg-pink-900/40 shadow-inner",
                textStrong: "text-pink-950 dark:text-white", textHighlight: "text-white drop-shadow-[0_0_10px_rgba(255,182,193,0.8)]",
                textAccent: "text-rose-500 dark:text-rose-400", skillIconFill: "text-blue-500 dark:text-cyan-400",
                skillTitle: "text-blue-600 dark:text-cyan-400", skillFill: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]",
                accentMuted: "bg-pink-400/30 dark:bg-pink-500/30", dnaColor1: "bg-rose-400 shadow-[0_0_15px_#f472b6]",
                dnaColor2: "bg-fuchsia-400 shadow-[0_0_15px_#e879f9]", dnaGradient: "from-rose-500/50 to-fuchsia-400/50",
            };
        }

        if (isMale) {
            return {
                pageBg: "bg-blue-50/80 dark:bg-[#050a1f]", matrixOpacity: "opacity-60", capsuleBorder: "border-white/10",
                capsuleIconFill: "text-blue-600 dark:text-cyan-400", cardBg: "bg-transparent",
                cardBorder: "border-blue-200/50 dark:border-blue-500/20", panelWrapper: "bg-blue-950/40 backdrop-blur-2xl border border-blue-500/20",
                highlightCard: "border-blue-400/30 bg-blue-800/20 hover:bg-blue-700/40 shadow-inner",
                textStrong: "text-blue-950 dark:text-white", textHighlight: "text-white drop-shadow-[0_0_12px_rgba(34,211,238,1)]",
                textAccent: "text-blue-600 dark:text-cyan-400", skillIconFill: "text-blue-500 dark:text-cyan-400",
                skillTitle: "text-blue-600 dark:text-cyan-400", skillFill: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]",
                accentMuted: "bg-blue-400/30 dark:bg-blue-500/30", dnaColor1: "bg-blue-500 shadow-[0_0_15px_#3b82f6]",
                dnaColor2: "bg-cyan-400 shadow-[0_0_15px_#22d3ee]", dnaGradient: "from-blue-500 to-cyan-400",
            };
        }

        return {
            pageBg: "bg-slate-200/30 dark:bg-[#030014]", matrixOpacity: "opacity-60", capsuleBorder: "border-white/20",
            capsuleIconFill: "text-blue-600 dark:text-cyan-400", cardBg: "bg-transparent",
            cardBorder: "border-white/60 dark:border-white/10", panelWrapper: "bg-slate-900/40 backdrop-blur-2xl border border-white/10",
            highlightCard: "border-white/20 bg-white/10 hover:bg-white/20 shadow-inner",
            textStrong: "text-slate-900 dark:text-white", textHighlight: "text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]",
            textAccent: "text-cyan-600 dark:text-cyan-400", skillIconFill: "text-blue-600 dark:text-cyan-400",
            skillTitle: "text-blue-600 dark:text-cyan-400", skillFill: "bg-cyan-500",
            accentMuted: "bg-slate-400/50 dark:bg-cyan-500/50", dnaColor1: "bg-cyan-400 shadow-[0_0_15px_#22d3ee]",
            dnaColor2: "bg-blue-500 shadow-[0_0_15px_#3b82f6]", dnaGradient: "from-cyan-400 to-blue-500",
        };
    };

    const theme = getTheme();
    const cardBaseStyle = `relative overflow-hidden transition-all duration-300 border shrink-0 ${theme.cardBorder}`;

    return (
        <div className={`w-full min-h-screen overflow-x-hidden overflow-y-auto custom-scrollbar relative transition-colors duration-1000 font-mono pb-20 ${theme.pageBg}`}>
            <div className={`fixed inset-0 z-0 ${theme.matrixOpacity} pointer-events-none mix-blend-overlay`}><MatrixRain /></div>

            {/* 🔥 BOTÃO DE VOLTAR PARA A PRÓPRIA WORKSTATION 🔥 */}
            <div className="fixed top-24 left-8 z-[100]">
                <button onClick={() => router.push('/workstation')} className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-black/60 transition-all shadow-lg">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sair do Espectador</span>
                </button>
            </div>

            <div className="w-full flex flex-col items-center justify-start relative z-20 pt-24 px-8">

                <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">

                    {/* HUD DO PERSONAGEM VISITADO */}
                    <div className="lg:col-span-6 relative flex items-start justify-start pl-4 lg:pl-10 mt-16 lg:mt-24">

                        <div className="absolute right-0 top-10 flex flex-col items-end z-30">
                            <span className={`text-2xl font-black tracking-tighter drop-shadow-md ${theme.textStrong}`}>
                                {visitedUser.name || "Unknown"}
                            </span>
                        </div>

                        <div className="relative flex items-start">
                            <div className={`relative w-[180px] h-[500px] rounded-[100px] border-[3px] backdrop-blur-3xl flex flex-col items-center justify-center z-20 py-10 shadow-[0_0_50px_rgba(255,255,255,0.05)] ${theme.capsuleBorder}`}>
                                <RealisticDNA theme={theme} />

                                <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative z-30">
                                    {/* 🔥 SOMENTE LEITURA: Sem input de arquivo ou ícone de câmera 🔥 */}
                                    <div className={`relative block w-28 h-28 rounded-full border-4 p-1 shadow-[0_0_30px_rgba(255,255,255,0.2)] bg-black border-cyan-400/50`}>
                                        <Image src={userImage} alt="Avatar" fill className="object-cover rounded-full" />
                                    </div>
                                </motion.div>
                            </div>

                            <div className="absolute left-[100%] top-16 flex flex-col gap-6 z-10">
                                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="relative flex items-center">
                                    <div className={`w-6 h-[2px] ${theme.accentMuted}`} />
                                    <div className={`border px-5 py-3 rounded-2xl backdrop-blur-md shadow-xl flex items-center gap-3 bg-black/20 ${theme.cardBorder}`}>
                                        <AcademicCapIcon className={`w-6 h-6 ${theme.capsuleIconFill}`} />
                                        <div>
                                            <div className={`text-[8px] uppercase font-black tracking-widest text-white/50`}>Level</div>
                                            <div className={`text-xs font-bold uppercase text-white`}>{academicLevel}</div>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="relative flex flex-col items-start mt-4">
                                    <div className="flex items-center">
                                        <div className={`w-10 h-[2px] ${theme.accentMuted}`} />
                                        <div className={`border px-5 py-3 rounded-2xl backdrop-blur-md shadow-xl flex items-center gap-3 relative z-20 bg-black/20 ${theme.cardBorder}`}>
                                            <BookOpenIcon className={`w-6 h-6 ${theme.capsuleIconFill}`} />
                                            <div>
                                                <div className={`text-[8px] uppercase font-black tracking-widest text-white/50`}>Curso</div>
                                                <div className={`text-xs font-bold uppercase truncate max-w-[180px] text-white`}>{userCourse || "Undeclared"}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`flex flex-col gap-4 mt-4 ml-16 relative z-10 border-l-[2px] pl-4 py-2 ${theme.cardBorder}`}>
                                        {DEFAULT_SKILLS.map((skill) => (
                                            <SkillDrawer key={skill.id} skill={skill} isOpen={activeSkill === skill.id} onToggle={() => setActiveSkill(activeSkill === skill.id ? null : skill.id)} theme={theme} />
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* NAVEGAÇÃO DE SALAS: CONTINUA USANDO A LÓGICA DO ALVO PARA CONECTÁ-LO À SALA DELE */}
                    <div className="lg:col-span-6 flex flex-col justify-center items-center gap-5 z-30 w-full max-w-[450px] mx-auto pb-10">
                        <div className={`w-full p-8 rounded-[40px] flex flex-col gap-6 ${theme.panelWrapper}`}>
                            <div onClick={() => router.push('/study-rooms/lounge')} className={cardBaseStyle + ` ${theme.highlightCard} p-5 rounded-3xl hover:scale-[1.02] cursor-pointer`}>
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <AnimatedBlueGlobe />
                                        <h2 className={`text-xl font-black uppercase tracking-tight ${theme.textHighlight}`}>Lounge</h2>
                                    </div>
                                    <ChevronRightIcon className={`w-5 h-5 transition-all ${theme.textHighlight} group-hover:translate-x-1`} />
                                </div>
                            </div>

                            {targetRoom && (
                                <div onClick={() => router.push(targetRoom.route)} className={cardBaseStyle + ` ${theme.highlightCard} p-5 rounded-3xl hover:scale-[1.02] cursor-pointer`}>
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <MiniAnimatedDNA theme={theme} />
                                            <h2 className={`text-xl font-black uppercase tracking-tight ${theme.textHighlight}`}>Sala de {userCourse}</h2>
                                        </div>
                                        <ChevronRightIcon className={`w-5 h-5 transition-all ${theme.textHighlight} group-hover:translate-x-1`} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🔥 MURAL DE FOTOS 3D COM O ID DO VISITADO 🔥 */}
                <div className={`w-full max-w-[1400px] border-t mt-8 ${theme.cardBorder}`}>
                    <NetworkMural visitedUserId={visitedUserId} />
                </div>
            </div>
        </div>
    );
}