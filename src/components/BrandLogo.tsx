import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap" aria-label="SOS Healthcare home">
      <Image src="/sos-logo.svg" alt="" width={28} height={28} className="h-6 w-6 shrink-0" />
      <span className={footer
        ? "text-base font-semibold tracking-tight text-gray-950 dark:text-white"
        : "text-sm sm:text-base font-semibold tracking-tight text-gray-950 dark:text-white"
      }>
        SOS Healthcare
      </span>
    </Link>
  );
}
