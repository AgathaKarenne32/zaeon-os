"use client";

import { ClipboardList } from "lucide-react";

export default function HumanitiesExamsModule() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 gap-4">
            <ClipboardList className="w-12 h-12 opacity-40" />
            <h2 className="text-sm font-bold uppercase tracking-[0.3em]">Assessments</h2>
            <p className="text-xs text-stone-400 dark:text-stone-600 max-w-sm text-center">
                Examination modules and assessment tools will be available here.
            </p>
        </div>
    );
}
