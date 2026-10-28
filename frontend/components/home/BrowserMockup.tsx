'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';

export const BrowserMockup: React.FC = () => {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-5xl mx-auto mt-12 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-teal-950/20"
    >
      {/* Browser chrome header */}
      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
        </div>
        <div className="px-4 py-1 text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 max-w-xs md:max-w-md w-full text-center truncate">
          https://gtacommuterbuddy.app/route?budget=15.00&depTime=now
        </div>
        <div className="w-12 text-right">
          <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
        </div>
      </div>

      {/* Interface Image Container */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-950">
        <Image
          src="/frontend_UI_example.jpg"
          alt="GTA Commuter Buddy React MapBox Application Interface"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover object-top"
        />
      </div>

      <figcaption className="py-2.5 px-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 font-mono">
        Production Application Interface View: Integrated MapBox Geocoding & Route Geometry Output
      </figcaption>
    </motion.figure>
  );
};