"use client";

import React from "react";
import { Alert } from "@mantine/core";

export const LimitationAlert: React.FC = () => {
  return (
    <Alert
      variant="light"
      color="amber"
      title="Project Scope & Version 1 Boundaries"
      icon={
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      className="mt-8 text-left border border-amber-300/40 dark:border-amber-800/40 bg-amber-50/70 dark:bg-amber-950/20"
    >
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        To keep computation fast and respect mapping API rate limits, routes are calculated across major GTA highway
        interchanges and connecting arterials. Version 1 is calibrated for light vehicles (passenger cars, SUVs, and
        light pickup trucks).
      </p>
    </Alert>
  );
};