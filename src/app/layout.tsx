import type { Metadata } from "next";
import { JetBrains_Mono, Orbitron, Bungee } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const orbitron = Orbitron({
  weight: ["700", "800", "900"], // heavy weights for brutal impact
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const bungee = Bungee({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-bungee",
});

export const metadata: Metadata = {
  title: "Sanjay J",
  description: "my portfolio site :)",
  icons: {
    icon: "/images/profile.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${orbitron.variable} ${bungee.variable}`}
    >
      <head />
      <body
        className={`${jetBrainsMono.className} antialiased text-2xl bg-background`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
