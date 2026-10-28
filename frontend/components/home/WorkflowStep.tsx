"use client";

import React from "react";
import { motion } from "motion/react";

export interface WorkflowStepProps {
  stepNumber: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  delayIndex: number;
}

export const WorkflowStep: React.FC<WorkflowStepProps> = ({
  stepNumber,
  title,
  description,
  icon,
  delayIndex,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delayIndex * 0.1 }}
      className="flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-2xl font-black font-mono text-slate-200 dark:text-slate-800">
          {stepNumber}
        </span>
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};