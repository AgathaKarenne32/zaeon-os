"use client";

import WorkStationPage from "@/app/workstation/page";

// Wrapper component that explicitly types the `isEmbedded` prop.
// Next.js page components (default exports from page.tsx files) are typed
// with IntrinsicAttributes and don't accept custom props in TypeScript.
// This wrapper casts the component to accept the prop correctly.

const WorkStationContent = WorkStationPage as React.FC<{ isEmbedded?: boolean }>;

export default WorkStationContent;
