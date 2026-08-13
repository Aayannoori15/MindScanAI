import { motion, useReducedMotion } from "framer-motion";

/**
 * Cinematic entrance for page content.
 *
 * Children rise and fade in sequence rather than all at once, which gives the
 * inner pages the same "revealed" quality as the Landing hero instead of
 * snapping into place. Wrap direct children in <Reveal> to opt them into the
 * stagger; anything else just fades with the page.
 *
 * Respects the OS reduce-motion setting via useReducedMotion, which reads the
 * same prefers-reduced-motion signal the stylesheet uses.
 */
export default function PageTransition({ children, className = "" }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: reduce ? { duration: 0 } : { staggerChildren: 0.07, delayChildren: 0.04 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** One staggered step inside a PageTransition. */
export function Reveal({ children, className = "" }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
