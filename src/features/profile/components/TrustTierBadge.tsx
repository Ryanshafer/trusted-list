"use client";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export const TIER_LABELS = ["Emerging", "Reliable", "Trustworthy", "Proven", "Stellar"] as const;
export type TierLabel = (typeof TIER_LABELS)[number];

// Duration in ms each tier step is held during the intro animation
const TIER_STEP_MS = 800;

interface TrustTierBadgeProps {
  /** Final tier index (0–4) to settle at after cycling */
  tierIndex: number;
  /** If true, skip the cycling animation and show the final tier immediately */
  static?: boolean;
  className?: string;
  iconClassName?: string;
}

export function TrustTierBadge({ tierIndex, static: isStatic = false, className, iconClassName }: TrustTierBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const skip = isStatic || prefersReducedMotion;

  const [displayTier, setDisplayTier] = useState(skip ? tierIndex : 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (skip) {
      setDisplayTier(tierIndex);
      return;
    }

    let current = 0;
    setDisplayTier(0);

    const step = () => {
      current += 1;
      setDisplayTier(current);
      if (current < tierIndex) {
        timerRef.current = setTimeout(step, TIER_STEP_MS);
      }
    };

    if (tierIndex > 0) {
      timerRef.current = setTimeout(step, TIER_STEP_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tierIndex, skip]);

  const label = TIER_LABELS[displayTier] ?? TIER_LABELS[0];

  return (
    <span className={className || "inline-flex items-center gap-1.5 text-sm font-semibold text-primary"}>
      <ShieldCheck className={iconClassName || "h-4 w-4 shrink-0"} />
      <AnimatePresence mode="wait">
        <motion.span
          key={displayTier}
          initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
