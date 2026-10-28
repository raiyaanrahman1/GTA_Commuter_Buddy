"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Burger, ActionIcon, Tooltip } from "@mantine/core";
import { DesktopMenu } from "./DesktopMenu";
import { MobileDrawer } from "./MobileDrawer";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar: React.FC = () => {
  const [opened, setOpened] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-2 md:grid-cols-3 items-center">
        {/* Left: Map-Themed Brand Logo */}
        <div className="flex items-center justify-start">
          <Link href="/" className="flex items-center space-x-2.5 group">
            {/* Custom Map Pin & Route Badge */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"
                />
                <circle cx="12" cy="9" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                GTA Commuter<span className="text-teal-600 dark:text-teal-400">Buddy</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider mt-0.5">
                SMART 407 ROUTING
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Horizontally Centered Navigation Links */}
        <div className="hidden md:flex items-center justify-center">
          <DesktopMenu />
        </div>

        {/* Right: Theme Toggle + GitHub ActionIcon + Mobile Burger */}
        <div className="flex items-center justify-end space-x-2 sm:space-x-3">
          <ThemeToggle />

          {/* GitHub ActionIcon with official logo */}
          <Tooltip label="GitHub Repository" withArrow>
            <ActionIcon
              component="a"
              href="https://github.com/raiyaanrahman1/GTA_Commuter_Buddy"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="subtle"
              aria-label="GitHub Repository"
              className="text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </ActionIcon>
          </Tooltip>

          <Burger
            opened={opened}
            onClick={() => setOpened((o) => !o)}
            aria-label="Toggle navigation drawer"
            className="md:hidden"
            size="sm"
          />
        </div>
      </div>

      <MobileDrawer opened={opened} onClose={() => setOpened(false)} />
    </header>
  );
};