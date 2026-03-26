"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";

const LOGO_DEFAULT = "/assets/zaeon-brain.png";

// Substitua pelos caminhos reais dos PNGs do seu personagem para a animação
const IMG_33_SRC = "/assets/zaeon-baby2.png";
const IMG_66_SRC = "/assets/zaeon-baby3.png";
const IMG_88_SRC = "/assets/zaeon-baby4.png";

const TIMELINE = {
    AUDIO_SRC: "/assets/sounds/boot-track.mp3",
    TOTAL_DURATION: 7.0,
    STAGE_2_BAR_APPEARS: 0.1,
    STAGE_3_MOD_1_START: 1.8,
    STAGE_4_MOD_2_START: 3.6,
    STAGE_5_MOD_3_START: 5.4,
};

type Props = {
    show?: boolean;
    onDone?: () => void;
    logoSrc?: StaticImageData | string;
};

export default function MacSplash({ show = true, onDone, logoSrc = LOGO_DEFAULT }: Props) {
    const [hasStarted, setHasStarted] = useState(false);
    const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [visible, setVisible] = useState(show);
    const [opacity, setOpacity] = useState(0);

    // Estado para controlar qual imagem do personagem está visível
    const [currentCharacterImg, setCurrentCharacterImg] = useState<StaticImageData | string>(logoSrc);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Ref para garantir que não spamamos o useState mudando a imagem a cada frame do RAF
    const imageFrameRef = useRef(0); // 0=default, 33=img33, 66=img66, 100=img100

    const isAudioPlaying = useRef(false);
    const startTimeRef = useRef<number | null>(null);
    const exitingRef = useRef(false);
    const phaseRef = useRef<0 | 1 | 2 | 3 | 4>(0);

    const onDoneRef = useRef(onDone);
    useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

    useEffect(() => {
        if (!show) return;
        setVisible(true);
        const openT = setTimeout(() => setOpacity(1), 10);
        return () => clearTimeout(openT);
    }, [show]);

    useEffect(() => {
        if (!show || !hasStarted) return;
        let raf = 0;
        const loop = () => {
            const realTimeElapsed = (performance.now() - (startTimeRef.current || performance.now())) / 1000;
            const audioTime = (isAudioPlaying.current && audioRef.current && !audioRef.current.ended)
                ? audioRef.current.currentTime : realTimeElapsed;
            const time = Math.max(audioTime, realTimeElapsed);

            let currentGlobalPercent = 0;
            if (time >= TIMELINE.STAGE_5_MOD_3_START) {
                if (phaseRef.current < 4) { phaseRef.current = 4; setPhase(4); }
                const elapsed = time - TIMELINE.STAGE_5_MOD_3_START;
                currentGlobalPercent = 75 + Math.min((elapsed / 1.6) * 25, 25);
            } else if (time >= TIMELINE.STAGE_4_MOD_2_START) {
                if (phaseRef.current < 3) { phaseRef.current = 3; setPhase(3); }
                const elapsed = time - TIMELINE.STAGE_4_MOD_2_START;
                currentGlobalPercent = 40 + Math.min((elapsed / 1.8) * 35, 35);
            } else if (time >= TIMELINE.STAGE_3_MOD_1_START) {
                if (phaseRef.current < 2) { phaseRef.current = 2; setPhase(2); }
                const elapsed = time - TIMELINE.STAGE_3_MOD_1_START;
                currentGlobalPercent = Math.min((elapsed / 1.8) * 40, 40);
            } else if (time >= TIMELINE.STAGE_2_BAR_APPEARS) {
                if (phaseRef.current < 1) { phaseRef.current = 1; setPhase(1); }
                currentGlobalPercent = 1;
            }

            // Atualiza barra de progresso
            if (progressBarRef.current) progressBarRef.current.style.width = `${currentGlobalPercent}%`;

            // ============================================================
            // NOVA LÓGICA DE ANIMAÇÃO DO PERSONAGEM (SOBREPOSIÇÃO)
            // ============================================================
            let newFrameValue = 0;
            let nextImageSource: StaticImageData | string = logoSrc;

            if (currentGlobalPercent >= 100) {
                newFrameValue = 100;
                nextImageSource = IMG_88_SRC;
            } else if (currentGlobalPercent >= 66) {
                newFrameValue = 66;
                nextImageSource = IMG_66_SRC;
            } else if (currentGlobalPercent >= 33) {
                newFrameValue = 33;
                nextImageSource = IMG_33_SRC;
            } else {
                newFrameValue = 0;
                nextImageSource = logoSrc;
            }

            // Atualiza o estado da imagem apenas quando cruzamos a porcentagem alvo
            if (newFrameValue !== imageFrameRef.current) {
                imageFrameRef.current = newFrameValue;
                setCurrentCharacterImg(nextImageSource);
            }
            // ============================================================

            if (time < TIMELINE.TOTAL_DURATION && !exitingRef.current) {
                raf = requestAnimationFrame(loop);
            } else if (!exitingRef.current) {
                exitingRef.current = true;

                // Força visualização do estado final
                if (progressBarRef.current) progressBarRef.current.style.width = `100%`;

                // Garante que a imagem final 100% esteja definida
                if (imageFrameRef.current !== 100) {
                    imageFrameRef.current = 100;
                    setCurrentCharacterImg(IMG_88_SRC);
                }

                // Adicionado delay de 800ms para garantir que o usuário veja os 100% antes da tela sumir
                setTimeout(() => {
                    setOpacity(0);
                    setTimeout(() => {
                        onDoneRef.current?.();
                        setVisible(false);
                        // IMPORTANTE: Não matamos o áudio aqui, ele continua para a Home.
                    }, 500); // Tempo da transição de opacidade
                }, 800);
            }
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [show, hasStarted, logoSrc]); // Adicionado logoSrc às dependências

    const handleInitiate = () => {
        if (hasStarted) return;

        startTimeRef.current = performance.now();

        // Tenta encontrar o áudio que a Navbar já preparou
        const audio = (window as any).zaeonAudio;

        if (audio) {
            audio.play().then(() => {
                isAudioPlaying.current = true;
                setHasStarted(true);
                // Avisa a Navbar para subir as barrinhas
                window.dispatchEvent(new CustomEvent("zaeon-music-sync"));
            }).catch((err: any) => {
                console.warn("Bloqueio de áudio:", err);
                setHasStarted(true);
            });
        } else {
            // Fallback caso a Navbar demore a carregar
            setHasStarted(true);
        }
    };

    if (!visible) return null;

    const zhPhrase = phase >= 4 ? "世界之希望已诞生" : phase >= 3 ? "日月星辰皆为吾家" : phase >= 1 ? "万物归一" : "";

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-500" style={{ opacity }}>
            <div className="flex flex-col items-center justify-center px-6">
                <button onClick={handleInitiate} className={`flex flex-col items-center justify-center transition-all duration-300 ${!hasStarted ? "cursor-pointer hover:scale-105 opacity-80" : "cursor-default"}`} disabled={hasStarted}>
                    {/* Esta é a única imagem central agora. 
                        O 'src' muda de acordo com o estado 'currentCharacterImg' 
                        que controlamos no loop de animação.
                    */}
                    <Image
                        src={currentCharacterImg}
                        alt="Zaeon Character Animation"
                        width={100}
                        height={100}
                        priority
                        className="mb-4 object-contain transition-transform duration-300"
                    />

                    {!hasStarted && <span className="text-white/80 tracking-[0.2em] text-xs font-medium animate-pulse">CLICK TO START ZAEONBOT</span>}
                </button>

                {/* Altura reduzida pois removemos a grid de imagens de baixo */}
                <div className="h-[90px] flex flex-col items-center justify-start mt-6 w-full">
                    {!hasStarted ? (
                        <div className="text-center text-[10px] tracking-widest text-sky-400/70 font-light mt-4 uppercase">For a better experience, use headphones</div>
                    ) : (
                        <>
                            <div className={`w-[200px] h-[3px] rounded-full bg-white/15 overflow-hidden transition-opacity duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                                <div ref={progressBarRef} className="h-full rounded-full" style={{ width: "0%", background: "linear-gradient(90deg,rgba(255,255,255,.9),rgba(230,236,255,.95),rgba(255,255,255,.9))", boxShadow: "0 0 8px rgba(255,255,255,0.35)", transition: "none" }} />
                            </div>

                            {zhPhrase && <div className="mt-6 text-center text-[10px] tracking-widest text-sky-400/90 font-light">{zhPhrase}</div>}

                            {/* A div anterior das 3 imagens foi removida daqui */}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}