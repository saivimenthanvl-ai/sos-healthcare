import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://sos-healthcare.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "SOS Healthcare — Emergency Ambulance & Hospital Finder",
    template: "%s | SOS Healthcare",
  },

  description:
    "SOS Healthcare: Get an ambulance within 10-20 minutes. Real-time location tracking via Fitbit/Smartwatch. Find nearby hospitals. No fees for emergency care.",

  applicationName: "SOS Healthcare",

  authors: [
    {
      name: "SOS Healthcare",
      url: BASE_URL,
    },
  ],

  creator: "SOS Healthcare",

  publisher: "SOS Healthcare",

  category: "Healthcare",

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
    type: "website",
    locale: "en_US",

    url: BASE_URL,

    siteName: "SOS Healthcare",

    title: "SOS Healthcare — Emergency Ambulance & Hospital Finder",

    description:
      "SOS Healthcare: Get an ambulance within 10-20 minutes. Real-time location tracking via Fitbit/Smartwatch. Find nearby hospitals. No fees for emergency care.",
  },

  twitter: {
    card: "summary_large_image",

    title: "SOS Healthcare — Emergency Ambulance & Hospital Finder",

    description:
      "Location-aware emergency tools, nearby hospital discovery, and health information sharing.",
  },

  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/sos-logo.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/sos-logo.svg",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOS Healthcare",
  },

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth"
      suppressHydrationWarning
    >
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
