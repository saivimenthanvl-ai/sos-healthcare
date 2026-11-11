import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SosLogo } from "@/components/SosLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative transition-colors">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-bold text-gray-900 dark:text-white">
            <SosLogo size={36} className="w-9 h-9" priority />
            <span>SOS Healthcare</span>
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Emergency healthcare at your fingertips
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 py-8 px-6 shadow-xl rounded-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
