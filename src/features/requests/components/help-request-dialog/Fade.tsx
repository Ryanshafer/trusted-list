import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export const contentTransition = {
  duration: 0.15,
  ease: "easeOut",
} as const;

export function Fade({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={contentTransition}
    >
      {children}
    </motion.div>
  );
}
