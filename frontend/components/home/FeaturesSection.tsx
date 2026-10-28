"use client";

import React from "react";
import { motion } from "motion/react";
import { FeatureCard, FeatureCardProps } from "./FeatureCard";

const USER_FEATURES: Omit<FeatureCardProps, "delayIndex">[] = [
  {
    title: "Custom Budget Control",
    badge: "Budgeting",
    description: "Slide or type any dollar budget to discover how much commute time you save for $5, $10, or $15.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Leave Now or Schedule Ahead",
    badge: "Departure Options",
    description: "Calculate trips right now with live incident traffic, or plan ahead using historical rush-hour models.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Official 407 Rate Calculations",
    badge: "Accurate Pricing",
    description: "Pricing is computed using the official Highway 407 light vehicle tariff schedules by zone and time period.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Fast Address & Landmark Search",
    badge: "Search",
    description: "Start typing any GTA address, landmark, or library to get accurate search suggestions instantly.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Visual On/Off Ramp Guidance",
    badge: "Interactive Map",
    description: "Interactive map clearly highlights where to merge onto Highway 407 and where to return to public roads.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    title: "Use Current Location",
    badge: "One-Click GPS",
    description: "Tap to route directly from your current position with automatic accuracy verification.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest font-mono"
          >
            Commuter Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Built Specifically for Drivers in the GTA
          </motion.h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Everything you need to regain control over your morning and evening commute.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {USER_FEATURES.map((feat, idx) => (
            <FeatureCard
              key={feat.title}
              title={feat.title}
              badge={feat.badge}
              description={feat.description}
              icon={feat.icon}
              delayIndex={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
};