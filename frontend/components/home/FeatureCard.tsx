"use client";

import React from "react";
import { motion } from "motion/react";

export interface FeatureCardProps {
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  delayIndex: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  badge,
  description,
  icon,
  delayIndex,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: delayIndex * 0.08 }}
      className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {badge}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};