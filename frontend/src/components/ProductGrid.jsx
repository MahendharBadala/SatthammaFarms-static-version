import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import SkeletonGrid from "./Loading/Skeleton/SkeletonGrid";
import FloatingHarvestLoader from "./Loading/FloatingHarvestLoader/FloatingHarvestLoader";

export default function ProductGrid({ loading, products }) {
  const [showLoader, setShowLoader] = useState(false);
useEffect(() => {
  let timer;

  if (loading) {
    timer = setTimeout(() => {
      setShowLoader(true);
    }, 250);
  } else {
    setShowLoader(false);
  }

  return () => clearTimeout(timer);
}, [loading]);

 if (loading) {
  return (
    <div className="relative">
      <SkeletonGrid />

      <AnimatePresence>
        {showLoader && <FloatingHarvestLoader />}
      </AnimatePresence>
    </div>
  );
}

  return (
    <motion.div
      className="
      grid
      grid-cols-2
      md:grid-cols-3
      lg:grid-cols-4
      gap-3
      md:gap-5
      "
      initial="hidden"
      animate="show"
    >

        {products.map((product, index) => {

          const row = Math.floor(index / 4);

          return (

            <motion.div
              key={product.id}
              initial={{
                opacity:0,
                y:18,
                scale:.98
              }}
              animate={{
                opacity:1,
                y:0,
                scale:1
              }}
              exit={{
                opacity:0
              }}
              transition={{
                duration:.45,
                delay:row*0.08,
                ease:"easeOut"
              }}
            >

              <ProductCard product={product}/>

            </motion.div>

          );

        })}

    </motion.div>
  );

}