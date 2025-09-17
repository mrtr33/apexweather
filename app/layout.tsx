import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/react"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApexWeather - Motorsport Weather Tracker",
  description: "Real-time weather updates for Formula 1, WRC, and MotoGP racing events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnects to reduce layout jank from late-loading assets */}
        <link rel="preconnect" href="https://{s}.tile.openstreetmap.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://{s}.basemaps.cartocdn.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://server.arcgisonline.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://stamen-tiles-a.ssl.fastly.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://openweathermap.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://storage.ko-fi.com" crossOrigin="anonymous" />

        {/* Preload frequently used marker assets to avoid icon pop-in */}
        <link rel="preload" as="image" href="/marker-icon.png" />
        <link rel="preload" as="image" href="/marker-shadow.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background dark:bg-darkBg text-gray-900 dark:text-white`}
      >
        <ClientLayout>{children}</ClientLayout>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
