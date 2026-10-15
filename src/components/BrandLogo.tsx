import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap" aria-label="SOS Healthcare home">
      <Image src="/sos-logo.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
      <span className={footer
        ? "text-lg font-semibold tracking-tight text-gray-950 dark:text-white"
        : "text-base sm:text-lg font-semibold tracking-tight text-blue-700 dark:text-blue-400"
      }>
        SOS Healthcare
      </span>
    </Link>
  );
}
