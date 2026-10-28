"use client";

import React, { useEffect } from "react";
import { MantineProvider, createTheme, useMantineColorScheme } from "@mantine/core";

const theme = createTheme({
  primaryColor: "teal",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  fontFamilyMonospace: "var(--font-mono), monospace",
  headings: {
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontWeight: "700",
  },
  defaultRadius: "md",
});

function TailwindSync({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [colorScheme]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <TailwindSync>{children}</TailwindSync>
    </MantineProvider>
  );
}