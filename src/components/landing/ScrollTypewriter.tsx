"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const mainParagraph = "We connect you with peers and proven experts who truly understand your challenges. Ask for help, share what you need, and get real answers — openly or privately. In this network, trust is earned through action and feedback, so the help you get comes from people who’ve actually been there.";
const finalEmphasis = "This is how your network should work.";

export const ScrollTypewriter = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mainWords = mainParagraph.split(" ");
    const finalWords = finalEmphasis.split(" ");
    const totalWords = [...mainWords, ...finalWords];

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 0.4", "center center"],
    });

    return (
        <section ref={containerRef} className="py-16 sm:py-24 md:py-48">
            <div className="container mx-auto px-4 md:px-12 flex justify-center">
                <div className="max-w-4xl text-left">
                    <p className="!font-sans text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] flex flex-wrap gap-x-[0.3em] gap-y-2">
                        {mainWords.map((word, i) => {
                            const start = i / totalWords.length;
                            // Each word fades in over a wider range to create overlap/softness
                            const end = (i + 5) / totalWords.length;
                            return <Word key={i} progress={scrollYProgress} range={[start, Math.min(end, 1)]}>{word}</Word>;
                        })}
                    </p>

                    <p className="mt-12 !font-sans text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] flex flex-wrap gap-x-[0.3em] gap-y-2">
                        {finalWords.map((word, i) => {
                            const wordIndex = mainWords.length + i;
                            const start = wordIndex / totalWords.length;
                            const end = (wordIndex + 5) / totalWords.length;
                            return (
                                <Word
                                    key={wordIndex}
                                    progress={scrollYProgress}
                                    range={[start, Math.min(end, 1)]}
                                    targetColor="#00A3AD"
                                >
                                    {word}
                                </Word>
                            );
                        })}
                    </p>
                </div>
            </div>
        </section>
    );
};

const Word = ({
    children,
    progress,
    range,
    targetColor = "#0f172a"
}: {
    children: string,
    progress: any,
    range: [number, number],
    targetColor?: string
}) => {
    // Opacity transitions from darker grey (0.4) to full opacity (1)
    const opacity = useTransform(progress, range, [0.4, 1]);
    const color = useTransform(
        progress,
        range,
        ["#94a3b8", targetColor] // text-slate-400 to target color
    );

    return (
        <motion.span
            style={{ opacity, color }}
            className="inline-block"
        >
            {children}
        </motion.span>
    );
};
