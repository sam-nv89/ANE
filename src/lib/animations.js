/**
 * animations.js — Централизованная библиотека пресетов Framer Motion.
 * Используется для обеспечения единого "Elite UX" во всем приложении (ANE).
 */

const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

const FAST_EASE = {
  duration: 0.15,
  ease: "easeOut",
};

// --- Page & Shared ---

export const pageFade = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.2, ease: "easeOut" },
};

export const pulse = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1 },
  transition: { repeat: Infinity, repeatType: "mirror", duration: 1 },
};

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, ease: "easeOut" }
};

// --- Modals & Dialogs ---

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: FAST_EASE,
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: SPRING_TRANSITION,
};

export const dropdownDown = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
  transition: FAST_EASE,
};

export const dropdownUp = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.95 },
  transition: FAST_EASE,
};

// --- Lists & Iteration ---

export const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: SPRING_TRANSITION,
};

// --- Micro-interactions (Hover / Tap) ---

export const tapScale = {
  whileTap: { scale: 0.96 },
};

export const cardHover = {
  whileHover: { y: -4, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' },
  transition: FAST_EASE,
};

export const highlightAttention = {
  initial: { scale: 0.95, opacity: 0.8 },
  animate: {
    scale: [1, 1.03, 1],
    opacity: 1,
    boxShadow: [
      '0 0 0px rgba(0, 245, 160, 0)',
      '0 0 20px rgba(0, 245, 160, 0.4)',
      '0 0 0px rgba(0, 245, 160, 0)'
    ]
  },
  transition: {
    duration: 0.8,
    repeat: 3,
    ease: "easeInOut"
  }
};
