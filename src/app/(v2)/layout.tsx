import type { Metadata, Viewport } from "next";
import { EB_Garamond, IBM_Plex_Mono } from "next/font/google";
import Shell from "@/modules/v2/components/shell";
import Header from "@/modules/v2/components/header";
import Preloader from "@/modules/v2/components/preloader";
import "@/modules/v2/v2.css";

const serif = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Sanjay J — Logbook, Vol. II",
  description:
    "The working logbook of Sanjay J: database internals, developer tools and small games, rendered in two tones.",
  icons: { icon: "/images/profile.png" },
};

export const viewport: Viewport = {
  themeColor: "#2e3037",
};

// Runs before first paint: restores the palette and skips the loader on repeat visits.
const boot = `(function(){var d=document.documentElement;d.classList.add('js');try{var p=localStorage.getItem('v2-palette');if(p)d.dataset.palette=p;var i=localStorage.getItem('v2-invert');if(i===null)i=matchMedia('(prefers-color-scheme: dark)').matches?'1':'0';d.dataset.invert=i;if(sessionStorage.getItem('v2-seen'))d.classList.add('is-ready','seen');}catch(e){d.classList.add('is-ready','seen');}})();`;

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-palette="ibm-8503"
      data-invert="0"
      className={`${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Preloader />
        <Shell>
          <Header />
          {children}
        </Shell>
      </body>
    </html>
  );
}
