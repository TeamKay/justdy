
import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/app/_components/ThemeProvider";

const markerFelt = localFont({
  src: "./fonts/MarkerFelt-Thin.woff2",
  variable: "--font-marker-felt",
  display: "swap",
  weight: "400",
});

const markerFeltWide = localFont({
  src: "./fonts/MarkerFelt-Wide.woff2",
  variable: "--font-marker-felt-wide",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Learn Math online with confidence | Justdy",
  description: "Math made with fun; let's figure it out together",
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
      className={`${markerFelt.variable} ${markerFeltWide.variable}`}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
