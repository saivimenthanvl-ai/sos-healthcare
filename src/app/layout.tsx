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
    "SOS Healthcare: Get an ambulance within 10-20 minutes. Real-time location tracking via Fitbit/Smartwatch. Find nearby hospitals. No fees for emergency care.",
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
    description: "Get an ambulance within 10-20 minutes. No fees.",
    url: "https://sos-healthcare.vercel.app",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body
        className={`${inter.variable} font-sans h-full bg-gray-50 text-gray-900 antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
