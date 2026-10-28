"use client";

import React from "react";
import { PreRequestPipeline } from "./PreRequestPipeline";
import { RuntimePipeline } from "./RuntimePipeline";

export const PipelineSection: React.FC = () => {
  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <PreRequestPipeline />
        <RuntimePipeline />
      </div>
    </section>
  );
};