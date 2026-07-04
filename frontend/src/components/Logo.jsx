import React from "react";

export function Logo({ className = "", size = 40 }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="brand-logo">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" fill="#2C4C3B" />
        <path d="M32 14c-6 6-6 14 0 20 6-6 6-14 0-20z" fill="#D4A373" />
        <path d="M14 40c8 0 14-4 18-10-4 10-10 14-18 14v-4z" fill="#C5684B" />
        <path d="M50 40c-8 0-14-4-18-10 4 10 10 14 18 14v-4z" fill="#C5684B" />
        <circle cx="32" cy="46" r="3" fill="#F9F6F0" />
      </svg>
      <div className="leading-none">
        <div className="font-serif text-lg font-semibold tracking-tight text-forest">SATTHAMMA</div>
        <div className="font-serif text-[11px] tracking-[0.35em] text-terracotta -mt-0.5">FARMS</div>
      </div>
    </div>
  );
}
