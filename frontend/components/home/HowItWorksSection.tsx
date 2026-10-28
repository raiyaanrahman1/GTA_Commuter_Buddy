"use client";

import React from "react";
import { motion } from "motion/react";
import { WorkflowStep, WorkflowStepProps } from "./WorkflowStep";

const STEPS: Omit<WorkflowStepProps, "delayIndex">[] = [
  {
    stepNumber: "01",
    title: "Pick Your Budget & Departure",
    description: "Enter your starting point, destination, and exact toll spending limit (from $0 to unconstrained).",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    stepNumber: "02",
    title: "Cross-Reference the 407",
    description: "The application identifies nearby Highway 407 on-ramps and off-ramps that could bypass heavy congestion spots.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    stepNumber: "03",
    title: "Calculate Tolls & Time",
    description: "Live traffic speeds and official 407 light vehicle kilometer rates are calculated across each candidate segment.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    stepNumber: "04",
    title: "Get Your Smart Route",
    description: "Receive the fastest possible route that strictly respects your budget, with clear entrance and exit instructions.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest font-mono"
          >
            How It Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Four Simple Steps to a Smarter Drive
          </motion.h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            No complicated math for you. Just enter your budget and let the app handle the trade-offs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, idx) => (
            <WorkflowStep
              key={step.stepNumber}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              icon={step.icon}
              delayIndex={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
};