import { motion } from "framer-motion";
import "./FloatingHarvestLoader.css";

export default function FloatingHarvestLoader() {
  return (
    <motion.div
      className="sf-loader-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="sf-loader-card"
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.8,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="sf-glow"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
          }}
        />

        <motion.svg
          className="sf-sprout"
          viewBox="0 0 120 120"
          animate={{
            rotate: [-3, 3, -3],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        >
          <path
            d="M60 98V50"
            stroke="#2F7D32"
            strokeWidth="6"
            strokeLinecap="round"
          />

          <path
            d="M60 56
               C40 50 34 34 48 22
               C62 24 67 42 60 56"
            fill="#4CAF50"
          />

          <path
            d="M60 70
               C80 64 86 46 72 34
               C58 38 53 56 60 70"
            fill="#69B34C"
          />
        </motion.svg>

        <motion.h4
          className="sf-loader-title"
          animate={{
            opacity: [0.65, 1, 0.65],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        >
          Preparing today's harvest...
        </motion.h4>

        <div className="sf-loader-dots">
          <span />
          <span />
          <span />
        </div>
      </motion.div>
    </motion.div>
  );
}