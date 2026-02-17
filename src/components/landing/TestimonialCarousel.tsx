import { Quote } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

interface TestimonialItem {
    quote: string;
    name: string;
    title: string;
    avatar: string;
}

const testimonials: TestimonialItem[] = [
    {
        quote:
            "Unlike other networks where I get bombarded with irrelevant pitches, The Trusted List feels like walking into a room of friends who want to help each other succeed.",
        name: "Sarah Jenkins",
        title: "Product Designer & Member",
        avatar: "https://i.pravatar.cc/150?u=sarah",
    },
    {
        quote:
            "Every intro I’ve gotten here has been warm, specific, and actionable. It’s the only community where I don’t need to qualify whether someone is legit.",
        name: "Marcus Lee",
        title: "Director of Partnerships",
        avatar: "https://i.pravatar.cc/150?u=marcus",
    },
    {
        quote:
            "I closed my last two hires through the list because people actually vouch for each other. No cold spam, just trusted recommendations.",
        name: "Priya Nair",
        title: "VP of Product",
        avatar: "https://i.pravatar.cc/150?u=priya",
    },
    {
        quote:
            "The conversations here move faster because everyone comes vetted. I spend less time filtering and more time building.",
        name: "Ethan Alvarez",
        title: "Founder, Stealth SaaS",
        avatar: "https://i.pravatar.cc/150?u=ethan",
    },
    {
        quote:
            "I joined for the referrals, stayed for the generosity. People actually follow up and make sure you get what you need.",
        name: "Jasmine Boyd",
        title: "Head of Marketing",
        avatar: "https://i.pravatar.cc/150?u=jasmine",
    },
];

const SLIDE_DURATION_MS = 7200;

export default function TestimonialCarousel() {
    const prefersReducedMotion = useReducedMotion();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (prefersReducedMotion) return;

        const id = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % testimonials.length);
        }, SLIDE_DURATION_MS);

        return () => window.clearInterval(id);
    }, [prefersReducedMotion]);

    const current = useMemo(() => testimonials[index], [index]);

    const motionVariants = prefersReducedMotion
        ? {
              initial: { opacity: 1, x: 0, scale: 1 },
              animate: { opacity: 1, x: 0, scale: 1 },
              exit: { opacity: 1, x: 0, scale: 1 },
          }
        : {
              initial: { opacity: 0, x: 96, scale: 0.96 },
              animate: { opacity: 1, x: 0, scale: 1 },
              exit: { opacity: 0, x: -96, scale: 0.9 },
          };

    return (
        <section className="py-24 bg-stone-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex justify-center mb-8">
                        <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white">
                            <Quote className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="relative h-[380px] md:h-[340px] lg:h-[320px] overflow-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={current.quote}
                                initial={motionVariants.initial}
                                animate={motionVariants.animate}
                                exit={motionVariants.exit}
                                transition={{
                                    duration: prefersReducedMotion ? 0 : 0.65,
                                    ease: "easeOut",
                                }}
                                className="absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <blockquote className="max-w-3xl text-2xl md:text-3xl font-medium text-slate-900 leading-relaxed mb-8">
                                    “{current.quote}”
                                </blockquote>

                                <div className="flex flex-col items-center">
                                    <div
                                        className="h-12 w-12 bg-slate-200 rounded-full mb-3 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${current.avatar})` }}
                                    />
                                    <cite className="not-italic">
                                        <span className="block font-semibold text-slate-900">
                                            {current.name}
                                        </span>
                                        <span className="block text-slate-500 text-sm">
                                            {current.title}
                                        </span>
                                    </cite>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="mt-10 flex justify-center gap-2" aria-hidden="true">
                        {testimonials.map((_, idx) => {
                            const isActive = idx === index;
                            return (
                                <span
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        isActive
                                            ? "w-10 bg-primary"
                                            : "w-6 bg-slate-200"
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
