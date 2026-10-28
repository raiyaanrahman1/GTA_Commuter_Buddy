"use client";

import React from "react";
import { ActionIcon, useMantineColorScheme, Tooltip } from "@mantine/core";

export const ThemeToggle: React.FC = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"} withArrow>
      <ActionIcon
        onClick={() => setColorScheme(isDark ? "light" : "dark")}
        size="lg"
        variant="subtle"
        aria-label="Toggle color mode"
        className="text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors"
      >
        {isDark ? (
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </ActionIcon>
    </Tooltip>
  );
};