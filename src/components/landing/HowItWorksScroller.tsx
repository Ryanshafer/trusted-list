import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import step0Image from "../../assets/images/step-0.png?url";
import step1Image from "../../assets/images/step-1.png?url";
import step2Image from "../../assets/images/step-2.png?url";
import step3Image from "../../assets/images/step-3.png?url";
import step4Image from "../../assets/images/step-4.png?url";
import { AutoClumpVectorField } from "./AutoClumpVectorField";

type StepVisual = "image" | "clump";

interface StepItem {
    stepLabel: string;
    title: string;
    description: string;
    visual: StepVisual;
    height: number;
    imageSrc?: string;
}

interface SectionMetrics {
    startY: number;
    stepDistance: number;
    interactiveDistance: number;
    releaseDistance: number;
    totalHeight: number;
    frameHeight: number;
    splitHeight: number;
    paneHeight: number;
}

const MOBILE_BREAKPOINT = 768;
const STEP_CARD_GAP = 140;
const ACTIVE_CARD_TOP = 230;
const RIGHT_VISUAL_FADE_MS = 420;
const SNAP_IDLE_MS = 140;
const FINAL_STEP_PROGRESS = 4;
const FINAL_STEP_ENTER_PROGRESS = FINAL_STEP_PROGRESS - 0.02;
const FINAL_STEP_RESET_PROGRESS = FINAL_STEP_PROGRESS - 0.35;
const FINAL_STEP_LOCK_MS = 550;
const STICKY_TOP_OFFSET = 112;
const HEADER_HEIGHT = 256;
const SPLIT_INSET_Y = 0;
const RIGHT_PANE_FRAME_PADDING_Y = 8;
const STEP_INTRO_OFFSET = 200;
const STEP_INTRO_SCROLL_DISTANCE = 140;
const STEP_VISUAL_HEIGHT = 595;
const MIN_PANE_HEIGHT = 560;
const MAX_PANE_HEIGHT = STEP_VISUAL_HEIGHT + RIGHT_PANE_FRAME_PADDING_Y;

const STEP_ITEMS: StepItem[] = [
    {
        stepLabel: "Step One",
        title: "Get vetted",
        description:
            "Every member is vouched for by someone whose reputation is already trusted.",
        height: 153,
        visual: "image",
        imageSrc: step0Image,
    },
    {
        stepLabel: "Step Two",
        title: "Name Your Need",
        description: "Ask for advice, recommendations, or support discreetly or publicly.",
        height: 132,
        visual: "image",
        imageSrc: step1Image,
    },
    {
        stepLabel: "Step Three",
        title: "Make the Connection",
        description: "Get thoughtful responses from peers who understand your situation.",
        height: 153,
        visual: "image",
        imageSrc: step3Image,
    },
    {
        stepLabel: "Step Four",
        title: "Close the Loop",
        description: "When you get the help you need, share the outcome and thank those who showed up.",
        height: 153,
        visual: "image",
        imageSrc: step4Image,
    },
    {
        stepLabel: "Step Five",
        title: "Build Trust",
        description: "Trust grows through action and feedback. Every time you show up, your reputation grows — and so does the community around you.",
        height: 153,
        visual: "clump",
    },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isDesktopViewport = () =>
    typeof window !== "undefined" && window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`).matches;

export const HowItWorksScroller = () => {
    const sectionRef = useRef<HTMLElement | null>(null);
    const scrollSnapTimeoutRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const hasActivatedFinalStepRef = useRef(false);
    const hasPrimarySequenceCompletedRef = useRef(false);
    const finalStepEnteredAtRef = useRef<number | null>(null);

    const [desktopMode, setDesktopMode] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stepIntroProgress, setStepIntroProgress] = useState(0);
    const [metrics, setMetrics] = useState<SectionMetrics>({
        startY: 0,
        stepDistance: 1,
        interactiveDistance: 1,
        releaseDistance: 1,
        totalHeight: 1600,
        frameHeight: HEADER_HEIGHT + MAX_PANE_HEIGHT,
        splitHeight: MAX_PANE_HEIGHT,
        paneHeight: MAX_PANE_HEIGHT,
    });
    const [finalStepStarted, setFinalStepStarted] = useState(false);
    const [finalStepUnlocked, setFinalStepUnlocked] = useState(false);

    const maxProgress = STEP_ITEMS.length - 1;

    const stepOffsets = useMemo(() => {
        const offsets: number[] = [0];
        for (let i = 1; i < STEP_ITEMS.length; i++) {
            offsets[i] = offsets[i - 1] + STEP_ITEMS[i - 1].height + STEP_CARD_GAP;
        }
        return offsets;
    }, []);

    const getStepOffsetAtProgress = (value: number) => {
        const bounded = clamp(value, 0, maxProgress);
        const baseIndex = Math.floor(bounded);
        const nextIndex = Math.min(baseIndex + 1, maxProgress);
        const t = bounded - baseIndex;
        const base = stepOffsets[baseIndex];
        const next = stepOffsets[nextIndex];
        return base + (next - base) * t;
    };
    const activeCardTop = Math.round(((metrics.paneHeight - 16) / MAX_PANE_HEIGHT) * ACTIVE_CARD_TOP);
    const headerCopy = useMemo(
        () => ({
            title: "How This Works — And Why It’s Different",
            subtitleLine1: "Most professional networks optimize for growth.",
            subtitleLine2: "We optimize for trust.",
        }),
        []
    );

    const handlePrimarySequenceComplete = useCallback(() => {
        if (hasPrimarySequenceCompletedRef.current) return;
        hasPrimarySequenceCompletedRef.current = true;
        setFinalStepUnlocked(true);
    }, []);

    const resetFinalStepSequence = useCallback(() => {
        if (
            !hasActivatedFinalStepRef.current &&
            !hasPrimarySequenceCompletedRef.current &&
            !finalStepStarted &&
            !finalStepUnlocked
        ) {
            return;
        }

        hasActivatedFinalStepRef.current = false;
        hasPrimarySequenceCompletedRef.current = false;
        finalStepEnteredAtRef.current = null;
        setFinalStepStarted(false);
        setFinalStepUnlocked(false);
    }, [finalStepStarted, finalStepUnlocked]);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        const updateViewportMode = () => {
            const nextDesktop = isDesktopViewport();
            setDesktopMode(nextDesktop);
            if (!nextDesktop) {
                setProgress(0);
                setStepIntroProgress(0);
                resetFinalStepSequence();
            }
        };

        updateViewportMode();
        window.addEventListener("resize", updateViewportMode);
        return () => window.removeEventListener("resize", updateViewportMode);
    }, [resetFinalStepSequence]);

    useEffect(() => {
        if (!desktopMode || !sectionRef.current) return;

        const computeMetrics = () => {
            const sectionRect = sectionRef.current!.getBoundingClientRect();
            const startY = window.scrollY + sectionRect.top;
            const stepDistance = Math.max(340, Math.round(window.innerHeight * 0.5));
            const interactiveDistance = stepDistance * maxProgress;
            const releaseDistance = Math.round(window.innerHeight * 0.42);
            const availableStickyHeight = Math.max(640, window.innerHeight - STICKY_TOP_OFFSET);
            const paneHeight = clamp(
                availableStickyHeight - HEADER_HEIGHT - SPLIT_INSET_Y,
                MIN_PANE_HEIGHT,
                MAX_PANE_HEIGHT
            );
            const splitHeight = paneHeight + SPLIT_INSET_Y;
            const frameHeight = HEADER_HEIGHT + splitHeight;
            const totalHeight =
                window.innerHeight + STEP_INTRO_SCROLL_DISTANCE + interactiveDistance + releaseDistance;

            setMetrics({
                startY,
                stepDistance,
                interactiveDistance,
                releaseDistance,
                totalHeight,
                frameHeight,
                splitHeight,
                paneHeight,
            });
        };

        computeMetrics();
        window.addEventListener("resize", computeMetrics);
        return () => window.removeEventListener("resize", computeMetrics);
    }, [desktopMode, maxProgress]);

    useEffect(() => {
        if (!desktopMode) return;

        const clearSnapTimeout = () => {
            if (scrollSnapTimeoutRef.current != null) {
                window.clearTimeout(scrollSnapTimeoutRef.current);
                scrollSnapTimeoutRef.current = null;
            }
        };

        const updateFromScroll = () => {
            const y = window.scrollY;
            const lockStart = metrics.startY;
            const introEndY = metrics.startY + STEP_INTRO_SCROLL_DISTANCE;
            const lockEnd =
                metrics.startY + STEP_INTRO_SCROLL_DISTANCE + metrics.interactiveDistance + metrics.releaseDistance;
            const finalStepY = metrics.startY + STEP_INTRO_SCROLL_DISTANCE + metrics.interactiveDistance;

            if (y <= lockStart) {
                setProgress(0);
                setStepIntroProgress(0);
                resetFinalStepSequence();
                clearSnapTimeout();
                return;
            }

            if (y >= lockEnd) {
                setProgress(maxProgress);
                setStepIntroProgress(1);
                clearSnapTimeout();
                return;
            }

            if (y < introEndY) {
                setStepIntroProgress(clamp((y - lockStart) / STEP_INTRO_SCROLL_DISTANCE, 0, 1));
                setProgress(0);
                clearSnapTimeout();
                return;
            }

            setStepIntroProgress(1);

            const rawProgress = clamp((y - introEndY) / metrics.stepDistance, 0, maxProgress);
            setProgress(rawProgress);

            if (rawProgress <= FINAL_STEP_RESET_PROGRESS && hasActivatedFinalStepRef.current) {
                resetFinalStepSequence();
            }

            const reachedFinalStep = rawProgress >= FINAL_STEP_ENTER_PROGRESS;
            if (reachedFinalStep && !hasActivatedFinalStepRef.current) {
                hasActivatedFinalStepRef.current = true;
                finalStepEnteredAtRef.current = performance.now();
                setFinalStepStarted(true);
                setFinalStepUnlocked(false);
            }

            if (reachedFinalStep && !finalStepUnlocked && y > finalStepY + 1) {
                const enteredAt = finalStepEnteredAtRef.current ?? performance.now();
                if (performance.now() - enteredAt >= FINAL_STEP_LOCK_MS) {
                    setFinalStepUnlocked(true);
                } else {
                    window.scrollTo({ top: finalStepY, behavior: "auto" });
                    clearSnapTimeout();
                    return;
                }
            }

            if (y > finalStepY + 8) {
                clearSnapTimeout();
                return;
            }

            clearSnapTimeout();
            scrollSnapTimeoutRef.current = window.setTimeout(() => {
                const nearestStep = Math.round(rawProgress);
                if (nearestStep === FINAL_STEP_PROGRESS && !finalStepUnlocked) {
                    window.scrollTo({ top: finalStepY, behavior: "smooth" });
                    return;
                }

                const targetY = introEndY + nearestStep * metrics.stepDistance;
                if (Math.abs(targetY - window.scrollY) > 2) {
                    window.scrollTo({ top: targetY, behavior: "smooth" });
                }
            }, SNAP_IDLE_MS);
        };

        const onScroll = () => {
            if (rafRef.current != null) return;
            rafRef.current = window.requestAnimationFrame(() => {
                rafRef.current = null;
                updateFromScroll();
            });
        };

        updateFromScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", onScroll);
            if (rafRef.current != null) {
                window.cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            clearSnapTimeout();
        };
    }, [desktopMode, finalStepStarted, finalStepUnlocked, maxProgress, metrics, resetFinalStepSequence]);

    const getStepTextOpacity = (index: number) => {
        const distance = Math.abs(progress - index);
        return clamp(1 - Math.min(distance, 1) * 0.67, 0.33, 1);
    };

    const getVisualOpacity = (index: number) => {
        const distance = Math.abs(progress - index);
        return clamp(1 - distance, 0, 1);
    };

    return (
        <>
            <section ref={sectionRef} className="relative hidden md:block" style={{ minHeight: `${metrics.totalHeight}px` }}>
                <div
                    className="sticky flex items-end px-[var(--rail-x)]"
                    style={{ top: `${STICKY_TOP_OFFSET}px`, height: `calc(100svh - ${STICKY_TOP_OFFSET}px)` }}
                >
                    <div className="w-full" style={{ height: `${metrics.frameHeight}px` }}>
                        <div className="h-full bg-white">
                            <div className="grid h-full" style={{ gridTemplateRows: `${HEADER_HEIGHT}px ${metrics.splitHeight}px` }}>
                                <header className="border border-solid border-neutral-300 p-2">
                                    <div className="flex h-60 flex-col items-center justify-center bg-stone-100 p-2.5 text-center">
                                        <h2 className="font-serif text-6xl font-normal tracking-tighter text-stone-800">
                                            {headerCopy.title}
                                        </h2>
                                        <p className="mt-5 max-w-3xl text-center font-sans text-2xl font-light text-stone-500">
                                            {headerCopy.subtitleLine1}
                                            <br />
                                            {headerCopy.subtitleLine2}
                                        </p>
                                    </div>
                                </header>

                                <div
                                    className="relative border-x border-b border-solid border-neutral-300"
                                    style={{ height: `${metrics.splitHeight}px` }}
                                >
                                    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-white" />
                                    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px -translate-x-1/2 bg-neutral-300" />
                                    <div className="grid h-full grid-cols-2">
                                        <div className="relative overflow-hidden bg-stone-100 m-2" style={{ height: `${metrics.paneHeight - 16}px` }}>
                                            <div
                                                className="absolute left-1/2 w-[292px] will-change-transform"
                                                style={{
                                                    transform: `translate(-50%, ${
                                                        activeCardTop +
                                                        (1 - stepIntroProgress) * STEP_INTRO_OFFSET -
                                                        getStepOffsetAtProgress(progress)
                                                    }px)`,
                                                }}
                                            >
                                                {STEP_ITEMS.map((step, index) => {
                                                    const opacity = getStepTextOpacity(index);
                                                    return (
                                                        <article
                                                            key={step.stepLabel}
                                                            className="w-[292px] transition-opacity duration-500"
                                                            style={{
                                                                opacity,
                                                                height: `${step.height}px`,
                                                                marginBottom:
                                                                    index === STEP_ITEMS.length - 1
                                                                        ? 0
                                                                        : `${STEP_CARD_GAP}px`,
                                                            }}
                                                        >
                                                            <p className="font-sans text-base leading-none text-stone-400">
                                                                {step.stepLabel}
                                                            </p>
                                                            <h3 className="mt-5 font-serif text-3xl font-normal leading-none tracking-tighter text-stone-800">
                                                                {step.title}
                                                            </h3>
                                                            <p className="mt-3 font-sans text-base leading-snug text-stone-500">
                                                                {step.description}
                                                            </p>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div
                                            className="relative overflow-hidden bg-white px-2 my-2"
                                            style={{ height: `${metrics.paneHeight - 16}px` }}
                                        >
                                            <div className="relative h-full w-full overflow-hidden bg-[#D9F1F3]">
                                                {STEP_ITEMS.map((step, index) => {
                                                    const layerOpacity = getVisualOpacity(index);
                                                    const shouldMountClump = step.visual === "clump" && finalStepStarted;
                                                    return (
                                                        <div
                                                            key={step.stepLabel}
                                                            className="absolute inset-0 grid place-items-center"
                                                            style={{
                                                                opacity: layerOpacity,
                                                            transition: `opacity ${RIGHT_VISUAL_FADE_MS}ms ease`,
                                                        }}
                                                    >
                                                        {step.visual === "image" && step.imageSrc ? (
                                                            <div className="absolute inset-0 overflow-hidden">
                                                                <img
                                                                    src={step.imageSrc}
                                                                    alt={step.title}
                                                                    className="absolute inset-0 h-full w-full max-w-none object-cover object-left-bottom"
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="absolute inset-0">
                                                                {shouldMountClump ? (
                                                                    <AutoClumpVectorField
                                                                        showControls={false}
                                                                            activateOnVisible={false}
                                                                            onPrimarySequenceComplete={handlePrimarySequenceComplete}
                                                                            pulseDelayMs={900}
                                                                        />
                                                                    ) : null}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="md:hidden">
                <div className="w-full border border-solid border-neutral-300 bg-white">
                    <header className="border-b border-solid border-neutral-300 bg-stone-50 px-4 py-8 text-center">
                        <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-700">
                            {headerCopy.title}
                        </h2>
                        <p className="mt-3 font-serif text-base text-stone-700/50">
                            {headerCopy.subtitleLine1}
                            <br />
                            {headerCopy.subtitleLine2}
                        </p>
                    </header>

                    <div className="space-y-0">
                        {STEP_ITEMS.map((step, index) => (
                            <article key={step.stepLabel} className="border-b border-solid border-neutral-300 last:border-b-0">
                                <div className="px-4 py-6">
                                    <p className="font-sans text-sm text-stone-700">{step.stepLabel}</p>
                                    <h3 className="mt-2 font-serif text-3xl font-bold tracking-tight text-stone-700">
                                        {step.title}
                                    </h3>
                                    <p className="mt-3 font-sans text-base leading-[1.4] text-stone-700/50">
                                        {step.description}
                                    </p>
                                </div>

                                <div className="bg-[#D9F1F3]">
                                    {step.visual === "image" && step.imageSrc ? (
                                        <img
                                            src={step.imageSrc}
                                            alt={step.title}
                                            className="h-auto w-full object-cover"
                                            loading={index === 0 ? "eager" : "lazy"}
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="relative mx-auto aspect-[727/684] w-full max-w-[727px]">
                                            {hasMounted && !desktopMode ? (
                                                <AutoClumpVectorField
                                                    showControls={false}
                                                    activateOnVisible={true}
                                                    pulseDelayMs={900}
                                                />
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};
