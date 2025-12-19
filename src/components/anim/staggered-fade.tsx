'use client';
import { cn } from '@/lib/utils';
import { motion, useInView } from 'framer-motion';
import * as React from 'react';
 
type TextStaggeredFadeProps = {
  text: string;
  className?: string;
  /** If true, animate on mount without waiting for in-view. */
  triggerOnMount?: boolean;
};

export const StaggeredFade: React.FC<TextStaggeredFadeProps> = ({
  text,
  className = '',
  triggerOnMount = false,
}) => {
  const variants = {
    hidden: { opacity: 0 },
    show: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.07 },
    }),
  };
 
  const letters = Array.from(text);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const shouldShow = triggerOnMount || isInView;
 
  return (
    <motion.h2
      ref={ref}
      initial="hidden"
      animate={shouldShow ? 'show' : 'hidden'}
      variants={variants}
      viewport={{ once: true }}
      className={cn(className)}
    >
      {letters.map((word, i) => (
        <motion.span key={`${word}-${i}`} variants={variants} custom={i} className="inline-block">
          {word === ' ' ? '\u00A0' : word}
        </motion.span>
      ))}
    </motion.h2>
  );
};
