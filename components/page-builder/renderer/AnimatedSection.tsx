'use client';

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { AnimationSettings } from '@/types/page-builder';
import { getAnimationVariants, getAnimationTransition, getStaggerTransition } from '@/lib/page-builder/hooks/useScrollAnimation';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: AnimationSettings;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

/**
 * Wrapper component that applies scroll-triggered animations to section content
 */
export function AnimatedSection({
  children,
  animation,
  className = '',
  style,
  id,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const enabled = animation?.enabled ?? false;

  useEffect(() => {
    // If animations are disabled, element is always "in view"
    if (!enabled) {
      setIsInView(true);
      return;
    }

    // If already animated, no need to observe
    if (hasAnimated) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, hasAnimated]);

  // If animations are disabled, just render children
  if (!enabled) {
    return (
      <div ref={ref} className={className} style={style} id={id}>
        {children}
      </div>
    );
  }

  const variants = getAnimationVariants(animation);
  const transition = getAnimationTransition(animation);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wrapper for staggered children animations
 */
interface AnimatedChildrenProps {
  children: ReactNode;
  animation?: AnimationSettings;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedChildren({
  children,
  animation,
  className = '',
  style,
}: AnimatedChildrenProps) {
  const enabled = animation?.enabled && animation?.stagger;

  if (!enabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const transition = getAnimationTransition(animation);
  const variants = getAnimationVariants(animation);
  const staggerTransition = getStaggerTransition(animation);

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: staggerTransition,
      }}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div
              key={index}
              variants={variants}
              transition={transition}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

/**
 * Individual animated item for use within AnimatedChildren
 */
interface AnimatedItemProps {
  children: ReactNode;
  animation?: AnimationSettings;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
}

export function AnimatedItem({
  children,
  animation,
  className = '',
  style,
}: AnimatedItemProps) {
  const enabled = animation?.enabled ?? false;

  if (!enabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const variants = getAnimationVariants(animation);
  const transition = getAnimationTransition(animation);

  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedSection;
