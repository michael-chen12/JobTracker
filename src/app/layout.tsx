import type { Metadata } from "next";
import "./globals.css";
import { AppScrollArea } from "@/components/layout/AppScrollArea";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Job Application Tracker",
  description: "AI-powered job application tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full overflow-hidden">
        <AppScrollArea>{children}</AppScrollArea>
        <Toaster />
      </body>
    </html>
  );
}
