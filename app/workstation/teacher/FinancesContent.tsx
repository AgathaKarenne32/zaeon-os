"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Calendar, DollarSign } from "lucide-react";

export default function FinancesContent() {
    return (
        <div className="p-6 md:p-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full h-full">

            {/* HEADER CARD */}
            <div className="w-full p-8 rounded-[2rem] bg-white/40 dark:bg-slate-900/20 backdrop-blur-3xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <Wallet className="text-emerald-600 dark:text-emerald-400" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                            Finanças
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                            Acompanhe repasses institucionais, bolsas de pesquisa e receitas de publicações.
                        </p>
                    </div>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: DollarSign, label: "Saldo Disponível", value: "R$ 0,00", color: "emerald", trend: null },
                    { icon: ArrowDownLeft, label: "Recebido (mês)", value: "R$ 0,00", color: "blue", trend: "—" },
                    { icon: ArrowUpRight, label: "Pendente", value: "R$ 0,00", color: "amber", trend: null },
                ].map((item) => {
                    const Icon = item.icon;
                    const colorMap: Record<string, string> = {
                        emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    };
                    return (
                        <motion.div
                            key={item.label}
                            whileHover={{ scale: 1.02 }}
                            className="p-6 rounded-[2rem] bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/60 dark:border-white/10 transition-all duration-300"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorMap[item.color]}`}>
                                <Icon size={20} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">
                                {item.label}
                            </span>
                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{item.value}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* TRANSACTIONS TABLE */}
            <div className="p-6 rounded-[2rem] bg-white/50 dark:bg-[#1a1a1a]/40 backdrop-blur-3xl border border-white/60 dark:border-white/10 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white/90 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-500" />
                        Histórico de Transações
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs text-slate-500 dark:text-white/50">
                        <Calendar size={14} />
                        Março 2026
                    </div>
                </div>

                <div className="w-full rounded-2xl border border-black/5 dark:border-white/5 bg-white/20 dark:bg-black/20 overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/50 uppercase tracking-widest font-semibold">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-white/40 italic">
                                    Nenhuma transação registrada. Os repasses aparecerão aqui quando forem processados pela instituição.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
