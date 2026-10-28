"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SectionTarget {
  id: string;
  label: string;
}

const SECTIONS: SectionTarget[] = [
  { id: "hero", label: "Top" },
  { id: "the-problem", label: "The Problem" },
  { id: "how-it-works", label: "How It Works" },
  { id: "features", label: "Features" },
];

export const FloatingToC: React.FC = () => {
  const [activeId, setActiveId] = useState<string>("hero");
  const [isRailHovered, setIsRailHovered] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside
      aria-label="Section Navigation"
      onMouseEnter={() => setIsRailHovered(true)}
      onMouseLeave={() => setIsRailHovered(false)}
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40"
    >
      <motion.div
        layout
        className="flex flex-col space-y-3.5 p-2 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5 transition-colors"
      >
        {SECTIONS.map((sec) => {
          const isActive = activeId === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className="group flex items-center justify-end space-x-2.5 px-1 py-1 rounded-full cursor-pointer focus:outline-none"
            >
              {/* Expand title label on hover without obscuring contents */}
              <AnimatePresence>
                {isRailHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18 }}
                    className={`text-xs font-medium whitespace-nowrap pl-2 ${
                      isActive
                        ? "text-teal-600 dark:text-teal-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                    }`}
                  >
                    {sec.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Minimalist dot indicator */}
              <div className="relative flex items-center justify-center w-4 h-4">
                {isActive && (
                  <motion.div
                    layoutId="active-toc-glow"
                    className="absolute inset-0 rounded-full bg-teal-500/25 dark:bg-teal-400/20"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <div
                  className={`rounded-full transition-all duration-200 ${
                    isActive
                      ? "w-2.5 h-2.5 bg-teal-600 dark:bg-teal-400 shadow-sm shadow-teal-500/50"
                      : "w-2 h-2 bg-slate-300 dark:bg-slate-700 group-hover:bg-teal-400/70"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </motion.div>
    </aside>
  );
};