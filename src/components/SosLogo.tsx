import React from "react";
import Image from "next/image";

interface SosLogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

export function SosLogo({ className = "w-8 h-8", size = 32, priority = false }: SosLogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src="/sos-logo.svg"
        alt="SOS Healthcare Logo"
        width={size}
        height={size}
        priority={priority}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export default SosLogo;

