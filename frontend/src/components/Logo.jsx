import React from "react";

/**
 * Satthamma Farms brand mark — hand-illustrated seal.
 * Rendered as an <img> so the artwork stays pixel-perfect (Ultra-HD source).
 * width-controlled via className / size prop.
 */
export function Logo({ size = 56, showWordmark = true, className = "" }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src="/brand/satthamma-logo.png"
        alt="Satthamma Farms"
        width={size}
        height={size}
        loading="eager"
        decoding="async"
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-2 ring-forest/20 shadow-sm bg-cream"
        data-testid="brand-logo-img"
      />
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-serif text-lg text-ink tracking-wide">SATTHAMMA</div>
          <div className="text-[10px] tracking-[0.35em] text-terracotta -mt-0.5">FARMS</div>
        </div>
      )}
    </div>
  );
}
