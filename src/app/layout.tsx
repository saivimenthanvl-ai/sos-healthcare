import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/Toaster";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://sos-healthcare.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SOS Healthcare | Emergency Help & Nearby Hospitals",
    template: "%s | SOS Healthcare",
  },
  description:
    "SOS Healthcare provides location-aware emergency request tools, nearby hospital discovery, health information sharing, and emergency contact support.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "SOS Healthcare | Emergency Help & Nearby Hospitals",
    description:
      "Location-aware emergency tools, nearby hospital discovery, and health information sharing.",
    url: BASE_URL,
    siteName: "SOS Healthcare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOS Healthcare | Emergency Help & Nearby Hospitals",
    description:
      "Location-aware emergency tools and nearby hospital discovery.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOS Health",
  },
};

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
