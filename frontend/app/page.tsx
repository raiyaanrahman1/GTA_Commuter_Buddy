import React from "react";
import { FloatingToC } from "@/components/home/FloatingToC";
import { HeroSection } from "@/components/home/HeroSection";
import { TheProblemSection } from "@/components/home/TheProblemSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";

export default function HomePage() {
  return (
    <main className="relative">
      <FloatingToC />
      <HeroSection />
      <TheProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
    </main>
  );
}