import React, { useEffect, useState } from "react";

/**
 * Full-screen branded loading window shown once when the site is first opened.
 * Stays up for a minimum time (so it doesn't just flash) and fades out smoothly
 * once the minimum time has passed. Doesn't reappear on route changes within
 * the same visit — only on a fresh page load.
 */
export default function SplashScreen({ minDurationMs = 1400 }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), minDurationMs);
    const removeTimer = setTimeout(() => setVisible(false), minDurationMs + 500);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, [minDurationMs]);

  if (!visible) return null;

  return (
    <div
      data-testid="splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream transition-opacity duration-500 ${fading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <div className="relative">
        <img
          src="/brand/satthamma-logo.png"
          alt="Satthamma Farms"
          width={104}
          height={104}
          className="rounded-full object-cover ring-4 ring-forest/15 shadow-lg bg-cream animate-[splashPulse_1.8s_ease-in-out_infinite]"
        />
      </div>
      <div className="mt-6 text-center">
        <div className="font-serif text-2xl tracking-wide text-ink">SATTHAMMA</div>
        <div className="text-[11px] tracking-[0.4em] text-terracotta -mt-1">FARMS</div>
      </div>
      <p className="mt-3 font-serif italic text-terracotta text-sm">
        "prathiokkari intaa, nanyamaina panta"
      </p>
      <div className="mt-8 flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-forest animate-[splashDot_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-forest animate-[splashDot_1.2s_ease-in-out_infinite]" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-forest animate-[splashDot_1.2s_ease-in-out_infinite]" style={{ animationDelay: "300ms" }} />
      </div>

      <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
