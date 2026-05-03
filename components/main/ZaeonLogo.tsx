"use client";

import React, { useEffect, useRef } from "react";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";
import animationData from "@/public/zaeon-logo.json";

export type AIState = "idle" | "thinking" | "executing";

interface ZaeonLogoProps {
  aiState: AIState;
  className?: string;
}

export default function ZaeonLogo({ aiState, className = "w-10 h-10" }: ZaeonLogoProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (!lottieRef.current) return;

    // Smooth transition logic could be implemented if lottie-react exposed speed tweening,
    // but setting speed directly is usually instantaneous. The looping ensures no abrupt resets.
    switch (aiState) {
      case "idle":
        lottieRef.current.setSpeed(0.5);
        break;
      case "thinking":
        lottieRef.current.setSpeed(1);
        break;
      case "executing":
        lottieRef.current.setSpeed(1.3);
        break;
    }
  }, [aiState]);

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
