'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AnimationSettings, AnimationEasing } from '@/types/page-builder';
import type { Transition, Easing } from 'framer-motion';

interface UseScrollAnimationOptions extends AnimationSettings {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseScrollAnimationReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  isInView: boolean;
  hasAnimated: boolean;
}

/**
 * Custom hook for scroll-triggered animations using Intersection Observer
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}): UseScrollAnimationReturn {
  const {
    enabled = false,
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
  } = options;

  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;

    if (entry.isIntersecting) {
      setIsInView(true);
      if (triggerOnce) {
        setHasAnimated(true);
      }
    } else if (!triggerOnce) {
      setIsInView(false);
    }
  }, [triggerOnce]);

  useEffect(() => {
    // If animations are disabled, element is always "in view"
    if (!enabled) {
      setIsInView(true);
      return;
    }

    // If already animated and triggerOnce is true, no need to observe
    if (hasAnimated && triggerOnce) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, hasAnimated, handleIntersection, threshold, rootMargin, triggerOnce]);

  return {
    ref,
    isInView: enabled ? isInView : true,
    hasAnimated,
  };
}

/**
 * Get animation variants based on settings
 */
export function getAnimationVariants(settings?: AnimationSettings) {
  const {
    type = 'fade',
    direction = 'up',
    distance = 50,
  } = settings || {};

  const getDirectionOffset = () => {
    switch (direction) {
      case 'up': return { x: 0, y: distance };
      case 'down': return { x: 0, y: -distance };
      // For left/right, use y instead of x to prevent horizontal overflow on mobile
      case 'left': return { x: 0, y: distance };
      case 'right': return { x: 0, y: distance };
      default: return { x: 0, y: 0 };
    }
  };

  const offset = type === 'slide' ? getDirectionOffset() : { x: 0, y: 0 };

  const baseHidden = {
    opacity: type === 'fade' || type === 'slide' || type === 'blur' ? 0 : 1,
    scale: type === 'scale' ? 0.8 : type === 'bounce' ? 0.3 : 1,
    rotate: type === 'rotate' ? -10 : type === 'flip' ? 90 : 0,
    filter: type === 'blur' ? 'blur(10px)' : 'blur(0px)',
    x: offset.x,
    y: offset.y,
  };

  const baseVisible = {
    opacity: 1,
    scale: 1,
    rotate: 0,
    filter: 'blur(0px)',
    x: 0,
    y: 0,
  };

  return {
    hidden: baseHidden,
    visible: baseVisible,
  };
}

/**
 * Convert easing string to Framer Motion compatible easing
 */
function getEasingValue(easing?: AnimationEasing): Easing {
  const easingMap: Record<AnimationEasing, Easing> = {
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    easeIn: [0.42, 0, 1, 1] as [number, number, number, number],
    easeOut: [0, 0, 0.58, 1] as [number, number, number, number],
    easeInOut: [0.42, 0, 0.58, 1] as [number, number, number, number],
    spring: [0.25, 0.1, 0.25, 1] as [number, number, number, number], // fallback for spring
  };

  return easingMap[easing || 'easeOut'];
}

/**
 * Get animation transition based on settings
 */
export function getAnimationTransition(settings?: AnimationSettings): Transition {
  const {
    speed = 'normal',
    delay = 0,
    duration: customDuration,
    easing = 'easeOut',
  } = settings || {};

  const speedMap = {
    slow: 800,
    normal: 500,
    fast: 300,
  };

  const duration = customDuration || speedMap[speed];

  if (easing === 'spring') {
    return {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      duration: duration / 1000,
      delay: delay / 1000,
    };
  }

  return {
    duration: duration / 1000,
    delay: delay / 1000,
    ease: getEasingValue(easing),
  };
}

/**
 * Get stagger transition for children
 */
export function getStaggerTransition(settings?: AnimationSettings) {
  const { staggerDelay = 100 } = settings || {};

  return {
    staggerChildren: staggerDelay / 1000,
    delayChildren: 0,
  };
}
