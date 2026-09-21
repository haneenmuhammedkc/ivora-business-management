"use client";

import React from "react";
import { motion, useReducedMotion, HTMLMotionProps } from "motion/react";

export interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * Standard subtle ease curve for enterprise fintech dashboards:
 * smooth acceleration, quick deceleration, zero bounce.
 */
const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * FadeIn: Subtle opacity fade with zero translation
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className = "",
  ...props
}: MotionWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0.1 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: "easeOut",
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeUp: Subtle upward slide with opacity reveal
 */
export function FadeUp({
  children,
  delay = 0,
  duration = 0.35,
  className = "",
  ...props
}: MotionWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: shouldReduceMotion ? 0 : 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: shouldReduceMotion ? 0.1 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: SMOOTH_EASE,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * SlideIn: Directional slide-in with subtle offset
 */
export interface SlideInProps extends MotionWrapperProps {
  direction?: "left" | "right" | "top" | "bottom";
  offset?: number;
}

export function SlideIn({
  children,
  direction = "left",
  offset = 14,
  delay = 0,
  duration = 0.35,
  className = "",
  ...props
}: SlideInProps) {
  const shouldReduceMotion = useReducedMotion();

  const getInitialOffset = () => {
    if (shouldReduceMotion) return { x: 0, y: 0 };
    switch (direction) {
      case "left":
        return { x: -offset, y: 0 };
      case "right":
        return { x: offset, y: 0 };
      case "top":
        return { x: 0, y: -offset };
      case "bottom":
        return { x: 0, y: offset };
      default:
        return { x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...getInitialOffset(),
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      transition={{
        duration: shouldReduceMotion ? 0.1 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: SMOOTH_EASE,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer: Orchestrates staggered entrance of child StaggerItems
 */
export interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  staggerInterval?: number;
  delayChildren?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerInterval = 0.05,
  delayChildren = 0.05,
  className = "",
  ...props
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerInterval,
        delayChildren: shouldReduceMotion ? 0 : delayChildren,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem: Child component to be used inside StaggerContainer
 */
export function StaggerItem({
  children,
  className = "",
  ...props
}: MotionWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.1 : 0.3,
        ease: SMOOTH_EASE,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}
