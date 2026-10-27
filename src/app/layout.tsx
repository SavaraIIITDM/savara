import type { Metadata } from "next";
import { Cinzel, Rajdhani } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollToTop from "@/components/ScrollToTop";
import { Analytics } from "@vercel/analytics/next"
import GlobalNav from "@/components/GlobalNav";
import ProgressBarProvider from "@/components/ProgressBarProvider";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SAVĀRA 2027",
  description: "The flagship techno-cultural fest of IIITDM Kancheepuram.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${cinzel.variable} ${rajdhani.variable} antialiased`}
      >
        <Analytics />
        <ProgressBarProvider>
          <SmoothScroll>
            <GlobalNav />
            {children}
          </SmoothScroll>
        </ProgressBarProvider>
        <ScrollToTop />
      </body>
    </html>
  );
}
