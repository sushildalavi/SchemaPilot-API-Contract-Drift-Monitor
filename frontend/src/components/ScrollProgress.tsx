/**
 * Scroll progress indicator at top of page.
 * Animation 7: scroll-linked width transform
 */
import { useScroll, motion } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] origin-left"
      style={{
        scaleX: scrollYProgress,
        background: "linear-gradient(to right, #6366f1, #8b5cf6, #a855f7)",
      }}
    />
  );
}
