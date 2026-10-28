"use client";

import React from "react";
import { AssetCard } from "./AssetCard";

export const PreRequestPipeline: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="border-l-4 border-teal-500 pl-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Phase 1: Pre-Request Network Ingestion & Static Graphs
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Executed once during backend boot up. Highway graphs are filtered and held in RAM.
        </p>
      </div>

      <AssetCard
        stageNumber="STAGE 01"
        title="Graph Extraction & Interchange Indexing"
        description="The GTA road network is initially loaded using OSMNx. Highway 407 interchanges are extracted into a dedicated toll graph where each interchange is indexed by kilometer reference distance from the western terminus. Major non-toll highway intersections are filtered to form the candidate arterial network."
        images={[
          {
            src: "/initial_GTA_graph.jpg",
            alt: "Initial GTA road network graph",
            label: "Before: Raw OSMNx Network",
          },
          {
            src: "/preloaded_graph.jpg",
            alt: "Filtered interchange graph",
            label: "After: Filtered Candidate Network",
          },
        ]}
        notes="Pre-filtering compresses the road graph down to primary decision intersections, eliminating thousands of residential street edges before any user request arrives."
      />
    </div>
  );
};