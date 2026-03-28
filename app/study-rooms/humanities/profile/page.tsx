"use client";

import { UserCircle } from "lucide-react";

export default function HumanitiesProfileModule() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 gap-4">
            <UserCircle className="w-12 h-12 opacity-40" />
            <h2 className="text-sm font-bold uppercase tracking-[0.3em]">Identity</h2>
            <p className="text-xs text-stone-400 dark:text-stone-600 max-w-sm text-center">
                Your academic identity and profile settings will appear here.
            </p>
        </div>
    );
}
