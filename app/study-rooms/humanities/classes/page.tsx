"use client";
import React, { Suspense } from 'react';
import ClassesView from '@/components/sub/ClassesView';

export default function LessonsModule() {
    return (
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center text-white/50">Loading...</div>}>
            <ClassesView room="humanities" themeColor="amber" />
        </Suspense>
    );
}