import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function WaitlistCTA() {
    const prefersReducedMotion = useReducedMotion();
    const [isInvited, setIsInvited] = useState(false);
    const [inviterFirstName, setInviterFirstName] = useState("");
    const [isVisible, setIsVisible] = useState(prefersReducedMotion);
    const cardRef = useRef<HTMLDivElement>(null);
    const lastScrollYRef = useRef(0);
    const isScrollingUpRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        lastScrollYRef.current = window.scrollY;
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            isScrollingUpRef.current = currentScrollY < lastScrollYRef.current;
            lastScrollYRef.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (prefersReducedMotion) {
            setIsVisible(true);
            return;
        }

        const node = cardRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        return;
                    }

                    // Only reset when user scrolls up so it can replay on next downward pass.
                    if (isScrollingUpRef.current) {
                        setIsVisible(false);
                    }
                });
            },
            { threshold: 0.4 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [prefersReducedMotion]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refId = params.get("ref");
        const firstNameParam = params.get("first_name")?.trim() ?? "";
        const fullNameParam = params.get("name")?.trim() ?? "";
        const parsedFirstName = firstNameParam || fullNameParam.split(/\s+/)[0] || "";
        const hasInvite = Boolean(refId && parsedFirstName);

        setInviterFirstName(parsedFirstName);
        setIsInvited(hasInvite);
    }, []);

    const waitForTop = () =>
        new Promise<void>((resolve) => {
            const start = performance.now();
            const timeoutMs = 1800;

            const checkPosition = () => {
                if (window.scrollY <= 2 || performance.now() - start > timeoutMs) {
                    resolve();
                    return;
                }
                window.requestAnimationFrame(checkPosition);
            };

            window.requestAnimationFrame(checkPosition);
        });

    const handleClick = async () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });

        if (!prefersReducedMotion) {
            await waitForTop();
        }

        window.dispatchEvent(
            new CustomEvent("open-waitlist", {
                detail: { preserveInvite: isInvited },
            })
        );
    };

    return (
        <section className="relative py-20 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    ref={cardRef}
                    initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
                    animate={prefersReducedMotion || isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
                    transition={
                        prefersReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.6, ease: "easeOut", delay: isVisible ? 0.15 : 0 }
                    }
                    className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-stone-50/20 backdrop-blur-sm border border-stone-200/70 shadow-2xl shadow-teal-900/5 px-8 py-12 md:px-12 md:py-16"
                >
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-amber-50/35 via-stone-50/20 to-stone-100/10" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="space-y-4 max-w-3xl">
                            <h3 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.02]">
                                Curious about a  <br className="hidden md:block" /> better kind of network?
                            </h3>
                            <p className="text-lg md:text-2xl text-slate-600 leading-relaxed">
                                {isInvited ? (
                                    <>
                                        {inviterFirstName} vouched for you.
                                        <br />
                                        Accept your invitation and see what you’ve been missing.
                                    </>
                                ) : (
                                    <>
                                        Join the waitlist and we’ll reach out when space opens up. <br className="hidden md:block" /> If you know a member, ask them to invite for you.
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={handleClick}
                                className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-10 md:px-12 h-14 text-lg font-semibold shadow-md shadow-slate-900/15 transition transform hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900 focus-visible:ring-offset-stone-100/70"
                                type="button"
                            >
                                Join {isInvited ? "the list" : "the waitlist"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
