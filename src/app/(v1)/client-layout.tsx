"use client";
import { ThemeProvider } from "@/components/theme-provider";
import HomeNavBar from "@/modules/home/ui/components/home-navbar";
import { useEffect } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Direction choices: NE, SE, SW, NW
    const directions = [
      { x: "40px", y: "-40px" },   // NE
      { x: "40px", y: "40px" },    // SE
      { x: "-40px", y: "40px" },   // SW
      { x: "-40px", y: "-40px" }   // NW
    ];
    
    // Pick a random direction
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    // Set CSS variables
    document.documentElement.style.setProperty('--x-offset', randomDirection.x);
    document.documentElement.style.setProperty('--y-offset', randomDirection.y);
  }, []);
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <HomeNavBar />
      {children}
    </ThemeProvider>
  );
}
