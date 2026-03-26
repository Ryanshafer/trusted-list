import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import logo from "../../assets/logo-light.svg?url";

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

export default function FloatingHeroBar() {
    const prefersReducedMotion = useReducedMotion();
    const [isInvited, setIsInvited] = useState(false);
    const [showJoinAction, setShowJoinAction] = useState(false);
    const [isAtPageTop, setIsAtPageTop] = useState(true);
    const joinButtonRef = useRef<HTMLButtonElement>(null);
    const [joinButtonWidth, setJoinButtonWidth] = useState(0);
    const signInShift = (joinButtonWidth || 176) + 12;
    const signInSlideDuration = 0.32;
    const joinFadeDuration = 0.22;

    useEffect(() => {
        const node = joinButtonRef.current;
        if (!node) return;

        const updateWidth = () => setJoinButtonWidth(node.offsetWidth);
        updateWidth();

        const observer = new ResizeObserver(updateWidth);
        observer.observe(node);
        return () => observer.disconnect();
    }, [isInvited]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refId = params.get("ref");
        const firstName = (params.get("first_name") || params.get("firstName") || "").trim();
        const fullName = (params.get("name") || params.get("referrer_name") || "").trim();
        const hasInviteName = Boolean(firstName || fullName.split(/\s+/)[0]);
        setIsInvited(Boolean(refId && hasInviteName));
    }, []);

    useEffect(() => {
        const hero = document.querySelector("[data-hero-section]") as HTMLElement | null;
        if (!hero) return;

        const update = () => {
            setIsAtPageTop(window.scrollY <= 2);

            const bottomCtaButton = document.querySelector("[data-bottom-cta-button]") as HTMLElement | null;
            const heroBottom = hero.getBoundingClientRect().bottom;
            const hasLeftHero = heroBottom <= 96;
            const ctaButtonRect = bottomCtaButton?.getBoundingClientRect();
            const hasCtaButtonInView = Boolean(
                ctaButtonRect &&
                    ctaButtonRect.top <= window.innerHeight &&
                    ctaButtonRect.bottom >= 0
            );
            // Only hide when the actual bottom CTA button is in the viewport.
            setShowJoinAction(hasLeftHero && !hasCtaButtonInView);
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    const joinLabel = useMemo(
        () => (isInvited ? "Join the list" : "Join the waitlist"),
        [isInvited]
    );

    const handleJoinClick = async () => {
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
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 sm:top-6">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    className="pointer-events-auto mx-auto flex sm:ml-8 sm:mr-8 items-center justify-between rounded-full border border-white/50 px-4 backdrop-blur-md shadow-2xl shadow-primary-500/10 sm:h-16 sm:px-6"
                    animate={{
                        backgroundColor: isAtPageTop
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(255, 255, 255, 0.8)",
                        borderColor: isAtPageTop
                            ? "rgba(255, 255, 255, 0.5)"
                            : "#e5e7eb",
                    }}
                    transition={
                        prefersReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                    }
                >
                    <img src={logo} alt="The Trusted List" className="h-8 w-auto sm:h-9" />

                    <div className="relative flex h-11 w-80 items-center justify-end sm:w-96">
                        <motion.a
                            href="/signin"
                            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-base text-slate-900 transition-colors hover:text-slate-500 sm:h-11 sm:px-5 sm:text-lg"
                            animate={{
                                x: showJoinAction ? -signInShift : 0,
                            }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : {
                                          duration: signInSlideDuration,
                                          ease: [0.22, 1, 0.36, 1],
                                          delay: showJoinAction ? 0 : joinFadeDuration,
                                      }
                            }
                        >
                            Sign in
                        </motion.a>

                        <motion.button
                            ref={joinButtonRef}
                            type="button"
                            onClick={handleJoinClick}
                            animate={{ opacity: showJoinAction ? 1 : 0 }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : {
                                          duration: joinFadeDuration,
                                          ease: "easeOut",
                                          delay: showJoinAction ? signInSlideDuration : 0,
                                      }
                            }
                            className="absolute right-0 inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-transform transition-colors hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F2EC] sm:h-11 sm:px-7 sm:text-base"
                            style={{ pointerEvents: showJoinAction ? "auto" : "none" }}
                        >
                            {joinLabel}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
