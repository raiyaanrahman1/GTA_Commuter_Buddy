"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@mantine/core";

export const ArchitectureHeader: React.FC = () => {
  return (
    <section className="relative pt-12 pb-14 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-mono text-teal-600 dark:text-teal-400 hover:underline mb-5"
        >
          &larr; Back to Overview
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="filled" color="teal" size="sm" className="font-mono">
            GRAPH THEORY & ROUTING ENGINE
          </Badge>
          <Badge variant="outline" color="gray" size="sm" className="font-mono">
            OSMNX + CONSTRAINED DIJKSTRA
          </Badge>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
        >
          Under the Hood: Engine Architecture
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-4xl leading-relaxed"
        >
          GTA Commuter Buddy bridges the gap between classic shortest-path algorithms and monetary toll constraints.
          Rather than querying full residential graphs on every run, we combine pre-loaded OSMNx interchanges,
          real-time HERE API polyline queries, and a custom Constrained Dijkstra implementation.
        </motion.p>
      </div>
    </section>
  );
};