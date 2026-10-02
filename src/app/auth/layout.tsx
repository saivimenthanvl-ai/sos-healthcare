import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600">
            <span className="text-3xl">🚑</span>
            SOS Healthcare
          </Link>
          <p className="mt-2 text-sm text-gray-600">
            Emergency healthcare at your fingertips
          </p>
        </div>
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">{children}</div>
      </div>
    </div>
  );
}
