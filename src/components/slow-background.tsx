"use client";
import { useEffect } from "react";

export default function SlowBackground() {
  useEffect(() => {
    // Make grid cells big and stop movement
    document.documentElement.style.setProperty("--grid-size", "120px");
    document.documentElement.style.setProperty(
      "--grid-animation-state",
      "paused"
    );

    return () => {
      // Reset to default
      document.documentElement.style.removeProperty("--grid-size");
      document.documentElement.style.removeProperty("--grid-animation-state");
    };
  }, []);
  return null;
}
