"use client";

import React from "react";
import { motion } from "motion/react";
import { LimitationAlert } from "./LimitationAlert";

export const TheProblemSection: React.FC = () => {
  return (
    <section id="the-problem" className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest font-mono">
            The Problem
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Why Everyday Navigation Apps Fail GTA Commuters
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold mb-4 font-mono">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Brutal Traffic vs. Shocking Toll Bills
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              For millions across the Greater Toronto Area, commuting along the 401 or QEW can take hours during rush
              hour. Highway 407 ETR is fast, but charges per kilometer based on the time of day. Taking the entire toll
              route every day adds hundreds of dollars to monthly expenses that many drivers simply cannot justify.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-4 font-mono">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Google Maps Only Gives You An &quot;All or Nothing&quot; Choice
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Navigation apps only allow a simple binary choice: avoid all tolls or allow unlimited tolls. Google Maps
              will suggest a $30 toll route to save just 8 minutes, with no way to specify a reasonable limit like
              <strong> &quot;Keep toll costs under $10&quot;</strong>.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <LimitationAlert />
        </motion.div>
      </div>
    </section>
  );
};