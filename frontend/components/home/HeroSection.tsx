"use client";

import React from "react";
import Link from "next/link";
import { Button, Badge } from "@mantine/core";
import { motion } from "motion/react";
import { InteractiveMapMockup } from "./InteractiveMapMockup";

export const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative pt-12 md:pt-16 pb-16 overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-gradient-to-tr from-teal-500/10 via-emerald-500/15 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <Badge
            variant="light"
            color="teal"
            size="lg"
            radius="xl"
            className="font-mono uppercase tracking-wider text-teal-700 dark:text-teal-300 border border-teal-500/20"
          >
            Smart GTA Route Optimization
          </Badge>
        </motion.div>

        {/* Clear font contrast for both Light and Dark mode */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight"
        >
          Beat GTA Traffic Without Breaking Your Budget.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed"
        >
          Stop guessing between 90 minutes of gridlock on the 401 and an expensive $35 bill on Highway 407.
          Tell us your budget ceiling, and we will find the fastest route using just the right amount of toll road.
        </motion.p>

        {/* Replaced old buttons with a single prominent Try It Out CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex justify-center"
        >
          <Button
            component={Link}
            href="/map"
            size="lg"
            color="teal"
            radius="md"
            className="shadow-lg shadow-teal-600/20 hover:scale-105 transition-transform font-bold px-8"
            leftSection={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            }
          >
            Try It Out
          </Button>
        </motion.div>

        {/* Embedded Interactive Map Application with Prominent Fullscreen Button */}
        <InteractiveMapMockup />
      </div>
    </section>
  );
};