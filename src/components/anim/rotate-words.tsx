"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type RotateWordsProps = {
  text: string;
  words: string[];
  className?: string;
  wordClassName?: string;
  intervalMs?: number;
  initialIndex?: number;
  /** If provided, the animation will advance until it reaches this index, then stop. */
  targetIndex?: number;
  /** Optional delay before the first step when targeting a specific index. Defaults to 0ms. */
  startDelayMs?: number;
  /** Animate the first word in? Defaults to true. */
  animateInitial?: boolean;
};

export function RotateWords({
  text = "Rotate",
  words = ["Word 1", "Word 2", "Word 3"],
  className,
  wordClassName,
  intervalMs = 5000,
  initialIndex = 0,
  targetIndex,
  startDelayMs = 0,
  animateInitial = true,
}: RotateWordsProps) {
  const safeInitial = words.length ? initialIndex % words.length : 0;
  const [index, setIndex] = React.useState(safeInitial);
  const isFirst = React.useRef(true);

  React.useEffect(() => {
    isFirst.current = false;
  }, []);

  React.useEffect(() => {
    if (!words.length) return;
    // If no targetIndex is specified, loop forever.
    if (targetIndex === undefined) {
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % words.length);
      }, intervalMs);
      return () => clearInterval(interval);
    }

    // If already at target, do nothing.
    if (targetIndex === index) return;

    // Step through each word until we reach the target, then stop.
    const current = index;
    const steps = (targetIndex - current + words.length) % words.length;
    if (steps === 0) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= steps; i++) {
      const next = (current + i) % words.length;
      const t = setTimeout(() => setIndex(next), startDelayMs + i * intervalMs);
      timeouts.push(t);
    }

    return () => timeouts.forEach(clearTimeout);
  }, [words.length, intervalMs, targetIndex, index, startDelayMs]);

  return (
    <div
      className={cn(
        "flex items-baseline gap-2",
        className
      )}
    >
      <span>{text}</span>{" "}
      <AnimatePresence mode="wait">
        <motion.span
      key={words[index]}
      initial={
        !animateInitial && isFirst.current
          ? false
          : { opacity: 0, y: -40 }
      }
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={wordClassName}
    >
      {words[index]}
    </motion.span>
  </AnimatePresence>
    </div>
  );
}
