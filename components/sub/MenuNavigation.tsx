"use client";
import React, { useState, useEffect } from "react";
import { 
  ChevronRightIcon, ChevronLeftIcon, ArrowLeftIcon, 
  ArrowRightStartOnRectangleIcon, BeakerIcon, DocumentTextIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { signIn, signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";

const OnboardModal = dynamic(() => import("@/components/main/OnboardModal"), { ssr: false });

const MENU_ITEMS = [
  { labelKey: "menu.new", href: "/signup" },
  { labelKey: "menu.load", href: "#" },
  { labelKey: "menu.options", href: "/settings" },
  { labelKey: "menu.manual", href: "/workstation/admin" },
];

// --- PERFIS AJUSTADOS: Apenas 3 (Lembre-se de adicionar "roles.professor" no seu arquivo i18n) ---
const ROLES = [
  { slug: "student", key: "roles.student" },
  { slug: "professor", key: "roles.professor" },
  { slug: "professional", key: "roles.professional" },
] as const;

export default function MenuNavigation() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [index, setIndex] = useState(0);
  const [roleIndex, setRoleIndex] = useState(0); 
  const [pickerOpen, setPickerOpen] = useState(false); 
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // 🔥 NOVO: Estado para verificar pesquisa ativa
  const [workTitle, setWorkTitle] = useState<string | null>(null);
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);

  const isLoggedIn = status === "authenticated";
  const isStudent = (session?.user as any)?.role === "student" || !(session?.user as any)?.role;
  // @ts-ignore
  const isAdmin = !!session?.user?.isAdmin;

  // 🔥 NOVO: Consulta a pesquisa ativa do aluno quando monta
  useEffect(() => {
    if (!isLoggedIn || !isStudent) return;
    const fetchResearch = async () => {
      setIsLoadingResearch(true);
      try {
        const email = session?.user?.email;
        if (!email) return;
        const res = await fetch(`/api/workspace?userId=${encodeURIComponent(email)}`);
        if (res.ok) {
          const json = await res.json();
          setWorkTitle(json.data?.workTitle || null);
        }
      } catch (e) {
        console.error("Failed to fetch research status", e);
      } finally {
        setIsLoadingResearch(false);
      }
    };
    fetchResearch();
  }, [isLoggedIn, isStudent, session?.user?.email]);

  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (item.labelKey === "menu.manual") return isAdmin;
    return true;
  });

  const panelClass = "w-full mt-24 rounded-[32px] overflow-hidden backdrop-blur-2xl transition-all duration-500 bg-cyan-950/10 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col";
  const cardBase = "group relative overflow-hidden flex items-center justify-between rounded-2xl px-4 min-h-[52px] w-full transition-all duration-300 cursor-pointer font-medium text-slate-950 dark:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-cyan-400/30";
  const cardSelected = "bg-cyan-400/10 border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]";
  const accentBar = (active: boolean) => `absolute left-1 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full transition-all duration-500 ${active ? "bg-cyan-400 opacity-100 scale-y-100" : "bg-transparent opacity-0 scale-y-0"}`;

  return (
    <div className={panelClass}>
      <nav className="px-5 py-6 min-h-[320px] w-full flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!isOptionsOpen ? (
            <motion.ul 
              key="main" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="flex flex-col gap-2 w-full"
            >
              
              {/* 🔥 PRIMEIRO ITEM: CONTA (com highlight para nova conta ou glow para logado) */}
              <li className="w-full" onMouseEnter={() => setIndex(0)} onClick={() => !isLoggedIn && setPickerOpen(true)}>
                <div className={`${cardBase} ${index === 0 ? cardSelected : ""} ${!isLoggedIn ? "ring-1 ring-cyan-400/40 animate-pulse-slow shadow-[0_0_20px_rgba(34,211,238,0.15)]" : ""} ${isLoggedIn ? "shadow-[0_0_12px_rgba(34,211,238,0.1)]" : ""}`}>
                  <div className={accentBar(index === 0)} />
                  <span className="truncate pr-2 text-sm tracking-tight pl-2">
                    {isLoggedIn ? `${session?.user?.name || 'User'} Lv.1` : t("menu.new")}
                  </span>
                  
                  {!isLoggedIn && pickerOpen ? (
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 shrink-0 z-20">
                      <ChevronLeftIcon 
                        className="w-3.5 h-3.5 cursor-pointer hover:text-cyan-400 transition-colors" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setRoleIndex(r => (r - 1 + ROLES.length) % ROLES.length); 
                        }} 
                      />
                      {/* O NOME DO PERFIL AGORA É CLICÁVEL PARA ABRIR O MODAL DE ONBOARD */}
                      <span 
                        className="text-[10px] min-w-[90px] text-center uppercase font-bold tracking-widest select-none hover:text-cyan-300 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOnboardOpen(true);
                        }}
                      >
                        {t(ROLES[roleIndex].key)}
                      </span>
                      <ChevronRightIcon 
                        className="w-3.5 h-3.5 cursor-pointer hover:text-cyan-400 transition-colors" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setRoleIndex(r => (r + 1) % ROLES.length); 
                        }} 
                      />
                    </div>
                  ) : <ChevronRightIcon className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />}
                </div>
              </li>

              {/* 🔥 NOVO: CARD DE PESQUISA (Apenas para alunos logados) */}
              {isLoggedIn && isStudent && (
                <li className="w-full">
                  <div
                    onClick={() => router.push("/research-lab")}
                    className={`${cardBase} ${workTitle ? "border-emerald-400/30 hover:border-emerald-400/50" : "border-cyan-400/20 hover:border-cyan-400/40"}`}
                  >
                    <div className={`absolute left-1 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full transition-all duration-500 ${workTitle ? "bg-emerald-400 opacity-100 scale-y-100" : "bg-cyan-400 opacity-60 scale-y-75"}`} />
                    <div className="flex items-center gap-3 pl-2 flex-1 min-w-0">
                      {workTitle ? (
                        <DocumentTextIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <BeakerIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">
                          {workTitle ? "Research" : "Lab"}
                        </span>
                        <span className="text-sm tracking-tight truncate">
                          {isLoadingResearch ? "..." : workTitle ? `Continuar: ${workTitle}` : "Iniciar Pesquisa"}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </li>
              )}

              {visibleMenuItems.slice(1).map((item, i) => {
                const isSel = index === i + 1;
                return (
                  <li key={item.labelKey} className="w-full" onMouseEnter={() => setIndex(i + 1)} onClick={() => {
                    if (item.labelKey === "menu.options") setIsOptionsOpen(true);
                    else if (item.labelKey === "menu.load" && !isLoggedIn) signIn('google');
                    else router.push(item.href);
                  }}>
                    <div className={`${cardBase} ${isSel ? cardSelected : ""}`}>
                      <div className={accentBar(isSel)} />
                      <span className="truncate pr-2 text-sm tracking-tight pl-2">{t(item.labelKey)}</span>
                      <ChevronRightIcon className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </li>
                );
              })}
            </motion.ul>
          ) : (
            <motion.div 
              key="options" 
              initial={{ x: 10, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              className="flex flex-col gap-3 w-full"
            >
               <button 
                  onClick={() => setIsOptionsOpen(false)} 
                  className="flex items-center gap-2 text-cyan-400/80 hover:text-cyan-400 text-[10px] font-bold uppercase mb-2 ml-2 transition-colors"
                >
                 <ArrowLeftIcon className="w-3.5 h-3.5" /> {t("menu.back")}
               </button>

               <div className={cardBase}>
                 <div className="flex flex-col flex-1 pl-2">
                   <span className="text-[9px] opacity-50 uppercase font-bold tracking-tighter">{t("options.language")}</span>
                   <span className="text-sm">{i18n.language.toUpperCase()}</span>
                 </div>
                 <select 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                   value={i18n.language} 
                   onChange={(e) => i18n.changeLanguage(e.target.value)}
                 >
                   <option value="en">English</option>
                   <option value="pt">Português</option>
                   <option value="es">Español</option>
                   <option value="zh">中文</option>
                   <option value="ko">한국어</option>

                 </select>
                 <ChevronRightIcon className="h-4 w-4 opacity-30" />
               </div>

               <div className={`${cardBase} hover:bg-red-500/20 hover:border-red-500/40`} onClick={() => signOut()}>
                 <div className="flex flex-col flex-1 pl-2">
                   <span className="text-[9px] opacity-50 uppercase font-bold tracking-tighter">Session</span>
                   <span className="text-sm">{t("menu.logout", "Disconnect")}</span>
                 </div>
                 <ArrowRightStartOnRectangleIcon className="h-4 w-4 opacity-30" />
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      
      <div className="px-8 pb-6 text-[10px] opacity-30 text-white tracking-[0.3em] font-light">
        {t("footer.version")}
      </div>
      
      {onboardOpen && (
        <OnboardModal 
          isOpen={onboardOpen} 
          onClose={() => setOnboardOpen(false)} 
          role={ROLES[roleIndex].slug} 
        />
      )}
    </div>
  );
}