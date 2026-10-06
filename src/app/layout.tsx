import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SOS Healthcare — Emergency Ambulance & Hospital Finder",
  description:
    "SOS Healthcare provides location-aware emergency request tools, nearby hospital discovery, and optional supported wearable health context.",
  keywords: [
    "emergency",
    "ambulance",
    "healthcare",
    "hospital",
    "SOS",
    "medical emergency",
    "Fitbit",
    "smartwatch",
    "real-time location",
  ],
  openGraph: {
    title: "SOS Healthcare — Emergency Ambulance & Hospital Finder",
    description: "Location-aware emergency request tools and nearby hospital discovery.",
    url: "https://sos-healthcare.vercel.app",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOS Health",
  },
};

import { ThemeProvider } from "@/contexts/ThemeContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-200`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
