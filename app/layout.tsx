import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "./_components/ui/sonner";
import { ThemeProvider } from "./_components/ui/theme-provider";
import { TooltipProvider } from "./_components/ui/tooltip";
import SiteAnalyticsTracker from "@/app/_components/SiteAnalyticsTracker";
import "katex/dist/katex.min.css";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Justdy | Learn. Grow. Succeed",
  description:
    "Justdy provides online courses, tutoring, educational resources, and learning opportunities for students and educators.",
  icons: {
    icon: "/logo.ico",
  },
  verification: {
    google: "googlef81a47f8ecddf48f.html",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteAnalyticsTracker />
          <TooltipProvider>
            {children}
            <Toaster closeButton position="bottom-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
