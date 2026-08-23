import React from "react";
import { motion } from "framer-motion";

/**
 * Lightweight CSS 3D hero — no WebGL dependency (works with React 19).
 * Layered floating orbs + parallax rings evoke an organic, breathing composition.
 */
export default function Hero3D() {
  const orbs = [
    { size: 260, color: "#2C4C3B", x: "50%", y: "50%", blur: 0, delay: 0, dur: 8 },
    { size: 180, color: "#D4A373", x: "78%", y: "22%", blur: 0, delay: 0.6, dur: 7 },
    { size: 140, color: "#C5684B", x: "18%", y: "72%", blur: 0, delay: 1.1, dur: 9 },
    { size: 90, color: "#2C4C3B", x: "22%", y: "28%", blur: 0, delay: 1.6, dur: 6 },
    { size: 70, color: "#D4A373", x: "82%", y: "78%", blur: 0, delay: 0.3, dur: 10 },
  ];
  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl bg-gradient-to-br from-cream2 via-cream to-cream2 border border-edge" data-testid="hero-3d">
      {/* concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[520, 400, 300, 200].map((s, i) => (
          <div
            key={s}
            className="absolute rounded-full border border-forest/10"
            style={{ width: s, height: s, animation: `spin ${30 + i * 8}s linear infinite ${i % 2 ? "reverse" : ""}` }}
          />
        ))}
      </div>

      {/* floating orbs */}
      {orbs.map((o) => (
        <motion.div
          key={`orb-${o.x}-${o.y}-${o.size}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -18, 0], x: [0, 10, 0] }}
          transition={{
            scale: { duration: 0.9, delay: o.delay },
            opacity: { duration: 0.9, delay: o.delay },
            y: { duration: o.dur, repeat: Infinity, ease: "easeInOut", delay: o.delay },
            x: { duration: o.dur * 1.3, repeat: Infinity, ease: "easeInOut", delay: o.delay },
          }}
          className="absolute rounded-full"
          style={{
            width: o.size, height: o.size,
            left: o.x, top: o.y, transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle at 30% 30%, ${o.color}f2, ${o.color}90 55%, ${o.color}30 90%)`,
            boxShadow: `inset -20px -30px 60px rgba(0,0,0,0.25), 0 20px 50px ${o.color}40`,
          }}
        />
      ))}

      {/* wheat/grain accent */}
      <svg className="absolute bottom-8 right-8 opacity-70 animate-float" width="120" height="120" viewBox="0 0 100 100" fill="none">
        <path d="M50 10 L50 90" stroke="#2C4C3B" strokeWidth="2" />
        {[20, 32, 44, 56, 68].map(y => (
          <g key={y}>
            <ellipse cx="42" cy={y} rx="6" ry="10" fill="#D4A373" transform={`rotate(-25 42 ${y})`} />
            <ellipse cx="58" cy={y} rx="6" ry="10" fill="#D4A373" transform={`rotate(25 58 ${y})`} />
          </g>
        ))}
      </svg>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
