import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const messages = [
  "🌱 Preparing today's harvest...",
  "🌾 Harvesting fresh produce...",
  "🥕 Sorting quality vegetables...",
  "📦 Packing with care...",
  "❤️ Delivering nature's goodness..."
];

export default function LoadingMessages() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-message">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45 }}
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}