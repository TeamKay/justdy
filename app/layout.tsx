import type { Metadata } from "next";

import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/app/_components/ThemeProvider";

export const metadata: Metadata = {
  title: "Justdy | Interactive online Math tutoring with confidence",
  description: "Math made with fun; let's figure it out together",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
