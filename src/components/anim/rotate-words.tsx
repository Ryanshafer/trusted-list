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
};

export function RotateWords({
  text = "Rotate",
  words = ["Word 1", "Word 2", "Word 3"],
  className,
  wordClassName,
  intervalMs = 5000,
  initialIndex = 0,
  targetIndex,
}: RotateWordsProps) {
  const safeInitial = words.length ? initialIndex % words.length : 0;
  const [index, setIndex] = React.useState(safeInitial);

  React.useEffect(() => {
    if (!words.length) return;
    // If no targetIndex or already at target, do nothing.
    if (targetIndex === undefined || targetIndex === index) return;

    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        const next = (prevIndex + 1) % words.length;
        if (next === targetIndex) {
          clearInterval(interval);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [words.length, intervalMs, targetIndex, index]);

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
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.4 }}
      className={wordClassName}
    >
      {words[index]}
    </motion.span>
  </AnimatePresence>
    </div>
  );
}
