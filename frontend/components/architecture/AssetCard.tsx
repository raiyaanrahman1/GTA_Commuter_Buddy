"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";

export interface AssetCardProps {
  stageNumber: string;
  title: string;
  description: string;
  images: {
    src: string;
    alt: string;
    label?: string;
  }[];
  notes?: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  stageNumber,
  title,
  description,
  images,
  notes,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 relative overflow-hidden"
    >
      <div className="flex items-center space-x-3 mb-4">
        <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-xs font-bold border border-teal-500/20">
          {stageNumber}
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{description}</p>

      {/* Asset Grid */}
      <div className={`grid gap-4 ${images.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {images.map((img, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-inner group"
          >
            {img.label && (
              <div className="px-3 py-1.5 text-[11px] font-mono text-slate-400 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <span>{img.label}</span>
                <span className="text-[9px] text-teal-400 uppercase font-semibold">Folium Visualizer</span>
              </div>
            )}
            <div className="relative aspect-[4/3] w-full bg-slate-950">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
            <div className="py-2 px-3 text-center text-[11px] font-mono text-slate-400 bg-slate-900/90 border-t border-slate-800">
              Engine Diagnostics Graph Visualization / Folium Render
            </div>
          </div>
        ))}
      </div>

      {notes && (
        <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <strong className="text-teal-600 dark:text-teal-400">Implementation Note: </strong>
          {notes}
        </div>
      )}
    </motion.div>
  );
};