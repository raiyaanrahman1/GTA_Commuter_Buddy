import React from "react";
import type { Metadata } from "next";
import { ArchitectureHeader } from "@/components/architecture/ArchitectureHeader";
import { PipelineSection } from "@/components/architecture/PipelineSection";

export const metadata: Metadata = {
  title: "Under the Hood: Engine Architecture | GTA Commuter Buddy",
  description:
    "Constrained Dijkstra solver, OSMNx graph extraction, and real-time HERE API edge weight assignment for Highway 407 ETR.",
};

export default function UnderTheHoodPage() {
  return (
    <main className="min-h-screen">
      <ArchitectureHeader />
      <PipelineSection />
    </main>
  );
}