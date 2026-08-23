import SkeletonCard from "./SkeletonCard";
import "./Skeleton.css";

export default function SkeletonGrid() {

  return (

    <div className="sf-products-wrapper">

      <div className="sf-products-grid">

        {Array.from({ length: 12 }).map((_, index) => (

          <SkeletonCard key={index} />

        ))}

      </div>

    </div>

  );

}