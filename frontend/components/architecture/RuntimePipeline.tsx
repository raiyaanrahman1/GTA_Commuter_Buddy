"use client";

import React from "react";
import { AssetCard } from "./AssetCard";

export const RuntimePipeline: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="border-l-4 border-emerald-500 pl-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Phase 2: Dynamic Runtime Execution & Constrained Dijkstra
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Triggered when a commuter submits an origin, destination, and budget limit.
        </p>
      </div>

      {/* Stage 2 */}
      <AssetCard
        stageNumber="STAGE 02"
        title="Intersection Evaluation & Toll Eligibility Check"
        description="The engine calls HERE API to obtain polyline data for candidate routes. These polylines are projected onto the pre-loaded 407 toll graph. If a toll route exists and overlaps with the 407 network, it qualifies as budget-eligible. If no toll route intersects, standard non-toll directions are immediately returned."
        images={[
          {
            src: "/user_route_graph.jpg",
            alt: "User route graph overlapping with candidate nodes",
            label: "Polyline Projection on 407 Network",
          },
        ]}
        notes="Short-circuiting paths that never touch the 407 saves external API calls and delivers instant non-toll responses."
      />

      {/* Stage 3 */}
      <AssetCard
        stageNumber="STAGE 03"
        title="Graph Simplification & Distance Clustering"
        description="To keep travel practical and avoid trivial 1-kilometer toll hops, toll nodes are simplified to ensure consecutive decision interchanges are spaced at least 5 kilometers apart. Public highway routes are connected to their closest toll nodes to establish valid transition edges."
        images={[
          {
            src: "/connected_graph.jpg",
            alt: "Connected and simplified route graph",
            label: "Connected Simplified Route Graph",
          },
        ]}
        notes="The 5 km minimum threshold prevents on-ramp and off-ramp detour thrashing."
      />

      {/* Stage 4 */}
      <AssetCard
        stageNumber="STAGE 04"
        title="Live Duration Weights & Official 407 Tariff Calculation"
        description="Real-time travel durations between graph waypoints are populated using live HERE API queries. Exact toll costs are calculated using the official 407 ETR light-vehicle tariff schedule based on zone, trip length, and rush-hour pricing windows."
        images={[
          {
            src: "/407_toll_rates.jpg",
            alt: "Highway 407 ETR light vehicle toll rate schedule",
            label: "Official Light Vehicle Toll Rates",
          },
        ]}
        notes="Tariffs are calculated directly via official rate tables rather than unreliable third-party estimates."
      />

      {/* Stage 5 */}
      <AssetCard
        stageNumber="STAGE 05"
        title="Constrained Dijkstra Path Determination"
        description="The Constrained Dijkstra algorithm solves for the fastest route across the unified graph such that total toll cost is strictly <= the user's budget. The optimal trajectory coordinates are formatted and sent to the client MapBox display."
        images={[
          {
            src: "/best_route.jpg",
            alt: "Best path satisfying budget constraint",
            label: "Final Evaluated Optimal Trajectory",
          },
        ]}
        notes="When budget is set to $0, the engine strictly outputs the public highway path. When budget is unlimited, it returns the fastest possible route."
      />

      {/* Infrastructure Details */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
          Backend Infrastructure & Performance Mechanics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-teal-600 dark:text-teal-400 block mb-1">
              Sliding TTL Redis Cache
            </span>
            Repeated route queries for the same origin, destination, and budget within a 5-minute rolling window are served directly from Redis memory cache.
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-teal-600 dark:text-teal-400 block mb-1">
              Token Bucket Rate Limiting
            </span>
            SlowAPI and Redis enforce client rate limits to defend downstream HERE API quotas from automated scraping.
          </div>
        </div>
      </div>
    </div>
  );
};