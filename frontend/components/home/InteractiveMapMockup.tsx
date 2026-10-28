"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@mantine/core";
import { motion } from "motion/react";

// Dynamically import MapDisplay to prevent SSR hydration errors with WebGL/window
const MapDisplay = dynamic(() => import("@/components/Map/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-slate-900 text-slate-400 font-mono text-sm">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
      Loading GTA Route Engine...
    </div>
  ),
});

export const InteractiveMapMockup: React.FC = () => {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="w-full max-w-5xl mx-auto mt-10 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-teal-900/10 dark:shadow-teal-950/30"
    >
      {/* Mockup Window Chrome Header */}
      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 pl-2 hidden sm:inline">
            Live Preview
          </span>
        </div>

        {/* Prominent Full Screen / Full Page App CTA */}
        <Button
          component={Link}
          href="/map"
          size="xs"
          color="teal"
          variant="filled"
          className="font-semibold shadow-sm"
          leftSection={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          }
        >
          Open Full Screen
        </Button>
      </div>

      {/* Embedded Live Map Application */}
      <div className="relative w-full h-[460px] sm:h-[540px] bg-slate-900 overflow-hidden">
        <MapDisplay />
      </div>

      <figcaption className="py-2.5 px-4 text-center text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 font-mono">
        Interact with the live application above, or click &quot;Open Full Screen&quot; to test your custom commute.
      </figcaption>
    </motion.figure>
  );
};