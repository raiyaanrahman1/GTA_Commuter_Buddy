"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer, Button, Divider } from "@mantine/core";

interface MobileDrawerProps {
  opened: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ opened, onClose }) => {
  const pathname = usePathname();

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="sm"
      title={
        <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
          <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
          </div>
          <span>GTA Commuter Buddy</span>
        </div>
      }
      className="md:hidden"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      styles={{
        content: {
          backgroundColor: "var(--mantine-color-body)",
        },
      }}
    >
      <div className="flex flex-col space-y-4 pt-2">
        {/* Route Planner button */}
        <Button
          component={Link}
          href="/map"
          onClick={onClose}
          color="teal"
          size="md"
          fullWidth
          leftSection={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
        >
          Open Live Map App
        </Button>

        <Divider my="xs" />

        {/* Section Quick Progress / Depth Indicator */}
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
          Home Page Guide
        </span>

        <div className="grid grid-cols-3 gap-2 py-1">
          <Link
            href="/#the-problem"
            onClick={onClose}
            className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600"
          >
            The Problem
          </Link>
          <Link
            href="/#how-it-works"
            onClick={onClose}
            className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600"
          >
            How It Works
          </Link>
          <Link
            href="/#features"
            onClick={onClose}
            className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600"
          >
            Features
          </Link>
        </div>

        <Divider my="xs" />

        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
          Pages
        </span>

        <Link
          href="/"
          onClick={onClose}
          className={`py-2 px-3 rounded-lg text-base font-medium transition-colors ${
            pathname === "/"
              ? "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-semibold"
              : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          Overview & Showcase
        </Link>

        <Link
          href="/under-the-hood"
          onClick={onClose}
          className={`py-2 px-3 rounded-lg text-base font-medium transition-colors ${
            pathname === "/under-the-hood"
              ? "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-semibold"
              : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          Under The Hood (Graph Architecture)
        </Link>

        <div className="pt-4 mt-auto">
          <Button
            component="a"
            href="https://github.com/raiyaanrahman1/GTA_Commuter_Buddy"
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            fullWidth
            leftSection={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            }
          >
            raiyaanrahman1 / GitHub
          </Button>
        </div>
      </div>
    </Drawer>
  );
};