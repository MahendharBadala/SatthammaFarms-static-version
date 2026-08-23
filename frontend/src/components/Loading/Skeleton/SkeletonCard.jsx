import "./Skeleton.css";

export default function SkeletonCard() {
  return (
    <div className="sf-skeleton-card">

      <div className="sf-skeleton-image shimmer" />

      <div className="sf-skeleton-content">

        <div className="sf-line shimmer title" />

        <div className="sf-line shimmer short" />

        <div className="sf-line shimmer price" />

        <div className="sf-button shimmer" />

      </div>

    </div>
  );
}