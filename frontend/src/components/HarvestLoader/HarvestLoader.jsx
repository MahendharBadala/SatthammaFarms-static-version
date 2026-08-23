import { motion } from "framer-motion";
import LoadingMessages from "./LoadingMessages";
import "./HarvestLoader.css";

export default function HarvestLoader() {
  return (
    <div className="loader-wrapper">

      <motion.div
        className="sun"
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          repeat: Infinity,
          duration: 3
        }}
      />

      <motion.div
        className="plant"
        animate={{
          scaleY: [0.5, 1],
          rotate: [-2, 2, -2]
        }}
        transition={{
          repeat: Infinity,
          duration: 2.5
        }}
      />

      <LoadingMessages />

    </div>
  );
}