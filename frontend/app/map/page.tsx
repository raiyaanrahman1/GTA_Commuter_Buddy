"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import MapDisplay to prevent SSR WebGL errors
const MapDisplay = dynamic(() => import("@/components/Map/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono text-sm">
      <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
      Loading GTA Commuter Map Interface...
    </div>
  ),
});

export default function MapPage() {
  return (
    <main className="w-full h-[calc(100vh-4rem)] relative overflow-hidden bg-slate-950">
      <MapDisplay />
    </main>
  );
}