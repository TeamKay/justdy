import type { Metadata } from "next";

import "./globals.css";

import { Toaster } from "sonner";

import { ThemeProvider } from "@/app/_components/ThemeProvider";

export const metadata: Metadata = {
  title: "Justdy",
  description: "Create, learn, and connect with Justdy.",
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