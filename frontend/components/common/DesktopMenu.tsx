"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Button } from "@mantine/core";

export const DesktopMenu: React.FC = () => {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isMap = pathname === "/map";
  const isUnderTheHood = pathname === "/under-the-hood";

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {/* Overview drop-down for home sections */}
      <Menu trigger="hover" openDelay={100} closeDelay={250} shadow="md" width={220}>
        <Menu.Target>
          <Button
            component={Link}
            href="/"
            variant="subtle"
            className={`font-medium transition-all ${
              isHome
                ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold"
                : "text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
            rightSection={
              <svg className="w-3.5 h-3.5 ml-0.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            }
          >
            Overview
          </Button>
        </Menu.Target>

        <Menu.Dropdown className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl">
          <Menu.Label className="text-slate-400 dark:text-slate-500 font-mono text-[11px] uppercase">
            Landing Sections
          </Menu.Label>
          <Menu.Item component={Link} href="/#the-problem" className="text-sm">
            The Problem
          </Menu.Item>
          <Menu.Item component={Link} href="/#how-it-works" className="text-sm">
            How It Works
          </Menu.Item>
          <Menu.Item component={Link} href="/#features" className="text-sm">
            Key Features
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* Main Map Navigation Link */}
      <Link
        href="/map"
        className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
          isMap
            ? "bg-teal-500 text-white shadow-sm shadow-teal-500/30"
            : "text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Map App
      </Link>

      {/* Architecture Deep-Dive */}
      <Link
        href="/under-the-hood"
        className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
          isUnderTheHood
            ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold"
            : "text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
        }`}
      >
        Under The Hood
      </Link>
    </div>
  );
};