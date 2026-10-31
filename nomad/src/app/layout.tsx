import type { Metadata } from "next";
import { Funnel_Display, Funnel_Sans } from "next/font/google";
import "./globals.css";

const display = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
  weight: "400",
});

const sans = Funnel_Sans({
  variable: "--font-funnel-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Nomad: Your taste travels",
  description:
    "Rebuild cultural continuity after a move. Nomad transplants the places, music, and rituals you loved into your new city.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
