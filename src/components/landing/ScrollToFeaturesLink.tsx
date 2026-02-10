'use client';

import type { MouseEvent } from "react";

export function ScrollToFeaturesLink() {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const featuresSection = document.getElementById("features");
    if (!featuresSection) {
      return;
    }

    event.preventDefault();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    featuresSection.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", "#features");
  };

  return (
    <a
      href="#features"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-lg h-11 px-6 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
    >
      See how it works
    </a>
  );
}
