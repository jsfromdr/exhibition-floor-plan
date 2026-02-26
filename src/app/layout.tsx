import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloorPlanListProvider } from "@/context/FloorPlanListContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exhibition Floor Plan",
  description: "Interactive floor plan viewer for exhibitions and trade shows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FloorPlanListProvider>{children}</FloorPlanListProvider>
      </body>
    </html>
  );
}
