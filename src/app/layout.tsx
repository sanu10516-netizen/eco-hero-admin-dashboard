import type { Metadata, Viewport } from "next";
import { Fredoka, Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { WorldBackdrop } from "@/components/world-backdrop";

/** Body copy and tables. Neutral on purpose, so the data stays the loudest thing. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Headings and every large figure.
 *
 * Rounded and heavy, the way the game's own UI is drawn. It is what stops the
 * console reading as a generic dashboard the moment you look at it.
 */
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Identifiers and raw Firestore output only. */
const jet = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eco Hero operations console",
  description:
    "Monitoring and research console for the Eco Hero game. Player activity, questionnaire results and level performance, read live from Firestore.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#e7f2dd",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fredoka.variable} ${jet.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        <WorldBackdrop />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
