import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowLeft as PrevIcon,
  ArrowRight as NextIcon,
  Plus,
  Minus,
  Leaf,
  ShieldCheck,
  HandHeart,
  PlayCircle,
} from "@phosphor-icons/react";
import { resolveMediaUrl } from "../components/MediaUploader";
import {
  fetchProductReviews,
  uploadReviewPhoto,
  submitReview,
} from "../lib/reviewApi";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function isVideo(url = "") {
  return (
    /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url) ||
    url.includes("/video/upload/")
  );
}

export default function ProductDetail() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
const [error, setError] = useState("");
const [activeIndex, setActiveIndex] = useState(0);
const [qty, setQty] = useState(1);

// Reviews
const [reviewsData, setReviewsData] = useState(null);
const [reviewLoading, setReviewLoading] = useState(true);
const [reviewError, setReviewError] = useState("");
const [reviewName, setReviewName] = useState("");
const [reviewRating, setReviewRating] = useState(5);
const [reviewText, setReviewText] = useState("");
const [reviewPhotos, setReviewPhotos] = useState([]);
const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const { add } = useCart();

  useEffect(() => {
    let cancelled = false;

    setProduct(null);
    setError("");
    setActiveIndex(0);

    axios
      .get(`${API}/products/${id}`)
      .then((r) => {
        if (cancelled) return;
        setProduct(r.data);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("Product detail error:", err);
        setError(
          err?.response?.data?.detail ||
          "Unable to load this product."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id]);
  
// NEW: reviews useEffect
  
    const refreshReviews = async () => {
  try {
    setReviewError("");

    const data = await fetchProductReviews(id);
    setReviewsData(data);

    return data;
  } catch (err) {
    console.error("Product reviews error:", err);

    setReviewError(
      err?.response?.data?.detail ||
      "Unable to load reviews."
    );

    throw err;
  }
};

useEffect(() => {
  let cancelled = false;

  const loadReviews = async () => {
    setReviewLoading(true);
    setReviewError("");
    setReviewsData(null);

    try {
      const data = await fetchProductReviews(id);

      if (!cancelled) {
        setReviewsData(data);
      }
    } catch (err) {
      if (cancelled) return;

      console.error("Product reviews error:", err);

      setReviewError(
        err?.response?.data?.detail ||
        "Unable to load reviews."
      );
    } finally {
      if (!cancelled) {
        setReviewLoading(false);
      }
    }
  };

  loadReviews();

  return () => {
    cancelled = true;
  };
}, [id]);
  const media = useMemo(() => {
    if (!product) return [];

    return [
      product.image_url,
      ...(product.gallery || []),
      product.video_url,
    ]
      .filter(Boolean)
      .filter(
        (url, index, arr) =>
          arr.indexOf(url) === index
      )
      .map((url) => ({
        url,
        type: isVideo(url) ? "video" : "image",
      }));
  }, [product]);

  useEffect(() => {
    if (media.length <= 1) return;

    const current = media[activeIndex];

    // Give videos more time; images change automatically every 4.5 sec.
    const delay = current?.type === "video" ? 7000 : 4500;

    const timer = setTimeout(() => {
      setActiveIndex((index) => (index + 1) % media.length);
    }, delay);

    return () => clearTimeout(timer);
  }, [activeIndex, media]);

  const previousMedia = () => {
    setActiveIndex(
      (index) => (index - 1 + media.length) % media.length
    );
  };

  const nextMedia = () => {
    setActiveIndex(
      (index) => (index + 1) % media.length
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted2 mb-5">{error}</p>

        <Link
          to="/products"
          className="btn-outline inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted2">
        Loading...
      </div>
    );
  }

  const currentMedia = media[activeIndex];

    const reviewList = reviewsData?.reviews ?? [];

// Always calculate the visible review count from the reviews
// actually returned to the customer.
const reviewCount = reviewList.length;

// Calculate the average from approved reviews displayed on this page.
// If there are no reviews, keep the default rating at 5.0.
const averageRating =
  reviewCount > 0
    ? Number(
        (
          reviewList.reduce(
            (total, review) => total + Number(review.rating || 0),
            0
          ) / reviewCount
        ).toFixed(1)
      )
    : 5.0;

// Calculate rating distribution from the visible approved reviews.
const reviewDistribution = {
  "5": reviewList.filter((review) => Number(review.rating) === 5).length,
  "4": reviewList.filter((review) => Number(review.rating) === 4).length,
  "3": reviewList.filter((review) => Number(review.rating) === 3).length,
  "2": reviewList.filter((review) => Number(review.rating) === 2).length,
  "1": reviewList.filter((review) => Number(review.rating) === 1).length,
};
    const handleReviewPhotoChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    if (reviewPhotos.length + files.length > 4) {
      setReviewError("Maximum 4 photos allowed per review.");
      return;
    }

    setReviewError("");

    try {
      const uploadedPhotos = [];

      for (const file of files) {
        const result = await uploadReviewPhoto(file);

        if (result?.url) {
          uploadedPhotos.push(result.url);
        }
      }

      setReviewPhotos((previous) => [
        ...previous,
        ...uploadedPhotos,
      ]);
    } catch (err) {
      console.error("Review photo upload error:", err);

      setReviewError(
        err?.response?.data?.detail ||
        "Unable to upload review photo."
      );
    }

    event.target.value = "";
  };

    const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (reviewSubmitting) return;

    if (!reviewText.trim() && reviewPhotos.length === 0) {
      setReviewError(
        "Please write a review or upload at least one photo."
      );
      return;
    }

    setReviewSubmitting(true);
    setReviewError("");

    try {
      await submitReview({
        product_id: id,
        customer_name: reviewName.trim() || "Customer",
        rating: reviewRating,
        review_text: reviewText.trim(),
        photo_urls: reviewPhotos,
      });

      setReviewName("");
      setReviewRating(5);
      setReviewText("");
      setReviewPhotos([]);

      setReviewError("");

      alert(
        "Thank you! Your review has been submitted for approval."
      );
    } catch (err) {
      console.error("Review submission error:", err);

      const detail = err?.response?.data?.detail;

      if (typeof detail === "object" && detail?.message) {
        setReviewError(detail.message);
      } else {
        setReviewError(
          typeof detail === "string"
            ? detail
            : "Unable to submit your review."
        );
      }
    } finally {
      setReviewSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-10">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-forest mb-6"
      >
        <ArrowLeft size={16} />
        Back to products
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">

        {/* MEDIA */}
        <div className="min-w-0">

          <div className="card-earth overflow-hidden bg-cream2">

            <div
              className="
                relative
                w-full
                aspect-[4/3]
                sm:aspect-[4/3]
                flex
                items-center
                justify-center
                overflow-hidden
              "
            >
              {currentMedia?.type === "video" ? (
                <video
                  key={currentMedia.url}
                  controls
                  autoPlay
                  muted
                  playsInline
                  onEnded={nextMedia}
                  src={resolveMediaUrl(currentMedia.url)}
                  className="
                    w-full
                    h-full
                    object-contain
                  "
                  data-testid="product-video"
                />
              ) : (
                <img
                  key={currentMedia?.url}
                  src={resolveMediaUrl(currentMedia?.url)}
                  alt={product.name}
                  className="
                    w-full
                    h-full
                    object-contain
                  "
                />
              )}

              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousMedia}
                    aria-label="Previous product media"
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      w-10
                      h-10
                      rounded-full
                      bg-white/90
                      shadow-lg
                      flex
                      items-center
                      justify-center
                      hover:bg-white
                      transition
                    "
                  >
                    <PrevIcon size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={nextMedia}
                    aria-label="Next product media"
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      w-10
                      h-10
                      rounded-full
                      bg-white/90
                      shadow-lg
                      flex
                      items-center
                      justify-center
                      hover:bg-white
                      transition
                    "
                  >
                    <NextIcon size={18} />
                  </button>
                </>
              )}

              {currentMedia?.type === "video" && (
                <div className="absolute top-3 left-3 chip !bg-white/90 !text-forest">
                  <PlayCircle size={14} />
                  Video
                </div>
              )}
            </div>
          </div>

          {/* MEDIA DOTS */}
          {media.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              {media.map((item, index) => (
                <button
                  key={`${item.url}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show media ${index + 1}`}
                  className={`
                    h-2.5
                    rounded-full
                    transition-all
                    ${
                      activeIndex === index
                        ? "w-7 bg-forest"
                        : "w-2.5 bg-edge hover:bg-muted2"
                    }
                  `}
                />
              ))}
            </div>
          )}

          {/* THUMBNAILS */}
          {media.length > 1 && (
            <div
              className="
                mt-4
                grid
                grid-cols-5
                sm:grid-cols-6
                gap-2
              "
              data-testid="product-gallery"
            >
              {media.map((item, index) => (
                <button
                  key={`${item.url}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  data-testid={`gallery-thumb-${index}`}
                  className={`
                    relative
                    aspect-square
                    rounded-lg
                    overflow-hidden
                    border-2
                    transition-colors
                    bg-cream2
                    ${
                      activeIndex === index
                        ? "border-forest"
                        : "border-transparent hover:border-edge"
                    }
                  `}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle
                        size={24}
                        weight="duotone"
                        className="text-forest"
                      />
                    </div>
                  ) : (
                    <img
                      src={resolveMediaUrl(item.url)}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="min-w-0">
          <div className="chip">{product.category}</div>

          <h1 className="font-serif text-4xl sm:text-5xl mt-2 text-ink leading-tight">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl text-forest font-semibold">
              ₹{product.price}
            </span>

            <span className="text-muted2 text-sm">
              / {product.unit}
            </span>
          </div>

          <p className="mt-5 text-muted2 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: Leaf, label: "Organic" },
              { icon: ShieldCheck, label: "No Chemicals" },
              { icon: HandHeart, label: "Hand-picked" },
            ].map((b) => (
              <div
                key={b.label}
                className="card-earth p-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-center"
              >
                <b.icon
                  size={22}
                  weight="duotone"
                  className="text-terracotta"
                />

                <span className="text-[11px] sm:text-xs font-semibold text-ink">
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center justify-center border border-edge rounded-full bg-white">
              <button
                data-testid="qty-decrease"
                onClick={() =>
                  setQty((q) => Math.max(1, q - 1))
                }
                className="p-3 hover:bg-cream2 rounded-l-full"
              >
                <Minus size={16} />
              </button>

              <span
                data-testid="qty-value"
                className="px-5 font-semibold"
              >
                {qty}
              </span>

              <button
                data-testid="qty-increase"
                onClick={() => setQty((q) => q + 1)}
                className="p-3 hover:bg-cream2 rounded-r-full"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              data-testid="detail-add-to-cart"
              onClick={() => {
                add(product, qty);
                toast.success(
                  `Added ${qty} × ${product.name}`
                );
              }}
              className="btn-primary flex-1"
            >
              Add to cart · ₹{product.price * qty}
            </button>
          </div>

          <div className="mt-6 text-xs text-muted2">
            In stock: {product.stock} {product.unit}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
<section className="mt-10 border-t pt-8">
  {/* Reviews Header */}
  <div className="mb-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Customer Reviews
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          What our customers say about this product
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 border border-green-100">
        <span className="text-green-600 text-sm">✓</span>
        <span className="text-xs font-medium text-green-700">
          Verified customer feedback
        </span>
      </div>
    </div>
  </div>

  {/* Rating Summary */}
  <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
    <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-5 sm:gap-8 items-center">

      {/* Average Rating */}
      <div className="text-center sm:border-r sm:border-gray-100 sm:pr-8">
        <div className="text-4xl sm:text-5xl font-bold text-gray-900 leading-none">
          {averageRating.toFixed(1)}
        </div>

        <div className="flex justify-center gap-0.5 mt-2 text-lg">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={
                star <= Math.round(averageRating)
                  ? "text-yellow-400"
                  : "text-gray-200"
              }
            >
              ★
            </span>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-1">
          {reviewCount}{" "}
          {reviewCount === 1 ? "customer review" : "customer reviews"}
        </p>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviewDistribution[String(star)] || 0;

          const percentage =
            reviewCount > 0
              ? Math.round((count / reviewCount) * 100)
              : 0;

          return (
            <div
              key={star}
              className="flex items-center gap-2 text-sm"
            >
              <span className="w-7 text-gray-600 font-medium">
                {star}★
              </span>

              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="w-8 text-right text-xs text-gray-400">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  {reviewLoading ? (
    <div className="py-8 text-center text-gray-500">
      Loading reviews...
    </div>
  ) : reviewError ? (
    <div className="py-8 text-center text-red-500">
      {reviewError}
    </div>
  ) : reviewList.length === 0 ? (
    <div className="py-8 text-center text-gray-500">
      No customer reviews yet. Be the first to review this product!
    </div>
  ) : (
    <div className="space-y-3">
  {reviewList.map((review) => (
    <article
      key={review.id}
      className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Review Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Customer Avatar */}
          <div className="w-10 h-10 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-sm font-bold text-green-700">
              {(review.customer_name || "C").charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {review.customer_name || "Customer"}
            </p>

            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-yellow-400 text-sm tracking-tight">
                {"★".repeat(Number(review.rating || 0))}
              </span>

              <span className="text-xs text-gray-400">
                {Number(review.rating || 0)}.0
              </span>
            </div>
          </div>
        </div>

        {/* Date */}
        <span className="shrink-0 text-xs text-gray-400 pt-1">
          {review.created_at
            ? new Date(review.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : ""}
        </span>
      </div>

      {/* Review Text */}
      {review.review_text && (
        <p className="mt-3 text-sm sm:text-[15px] leading-6 text-gray-700 whitespace-pre-wrap">
          {review.review_text}
        </p>
      )}

      {/* Customer Photos */}
      {review.photo_urls?.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mt-3">
          {review.photo_urls.map((photo, index) => (
            <a
              key={`${review.id}-photo-${index}`}
              href={photo}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <img
                src={photo}
                alt={`Customer review ${index + 1}`}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}

      {/* Admin Response */}
      {review.admin_response && (
        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                S
              </span>
            </div>

            <p className="text-sm font-semibold text-gray-800">
              Satthamma Farms
            </p>
          </div>

          <p className="mt-2 text-sm leading-5 text-gray-600 whitespace-pre-wrap">
            {review.admin_response}
          </p>
        </div>
      )}
    </article>
  ))}
</div>
  )}

 {/* Write a Review */}
<div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
  <div className="flex items-start justify-between gap-3 mb-5">
    <div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
        Share your experience
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 mt-1">
        Tell other customers what you think about this product.
      </p>
    </div>

    <div className="hidden sm:flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-green-100">
      <Leaf size={20} weight="fill" className="text-green-600" />
    </div>
  </div>

  {/* Customer Name */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      Your name
    </label>

    <input
      type="text"
      value={reviewName}
      onChange={(e) => setReviewName(e.target.value)}
      placeholder="Enter your name"
      maxLength={100}
      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
    />
  </div>

  {/* Rating */}
<div className="mb-5">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    How would you rate it?
  </label>

  <div className="flex items-center gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setReviewRating(star)}
        aria-label={`Rate ${star} out of 5`}
        className={`text-3xl leading-none transition-all duration-200 ${
          star <= reviewRating
            ? "scale-110"
            : "grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:scale-105"
        }`}
      >
        {star <= reviewRating ? "🌟" : "⭐"}
      </button>
    ))}

    <span className="ml-2 text-sm font-semibold text-gray-700">
      {reviewRating}/5
    </span>
  </div>

  <p className="mt-2 text-xs text-gray-500">
    {reviewRating === 1 && "😕 Not great"}
    {reviewRating === 2 && "🙂 Could be better"}
    {reviewRating === 3 && "😊 Good"}
    {reviewRating === 4 && "😍 Very good"}
    {reviewRating === 5 && "🤩 Loved it!"}
  </p>
</div>

  {/* Review Text */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      Your review
    </label>

    <textarea
      value={reviewText}
      onChange={(e) => setReviewText(e.target.value)}
      placeholder="How was the product? Share your experience..."
      maxLength={2000}
      rows={4}
      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
    />

    <div className="mt-1 text-right text-xs text-gray-400">
      {reviewText.length}/2000
    </div>
  </div>

  {/* Photos */}
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-gray-700">
        Add photos
        <span className="ml-1 text-xs font-normal text-gray-400">
          (optional)
        </span>
      </label>

      <span className="text-xs text-gray-400">
        {reviewPhotos.length}/4
      </span>
    </div>

    <label
      className={`flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-medium transition ${
        reviewPhotos.length >= 4
          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
          : "cursor-pointer border-gray-300 bg-white text-gray-600 hover:border-green-400 hover:bg-green-50"
      }`}
    >
      <Plus size={18} />

      <span>
        {reviewPhotos.length >= 4
          ? "Maximum 4 photos added"
          : "Upload product photos"}
      </span>

      {reviewPhotos.length < 4 && (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={reviewSubmitting}
          className="hidden"
          onChange={handleReviewPhotoChange}
        />
      )}
    </label>

    {/* Photo Previews */}
    {reviewPhotos.length > 0 && (
      <div className="flex flex-wrap gap-2.5 mt-3">
        {reviewPhotos.map((photo, index) => (
          <div
            key={`${photo.url}-${index}`}
            className="relative group"
          >
            <img
              src={photo.url}
              alt={`Review upload ${index + 1}`}
              className="w-20 h-20 object-cover rounded-xl border border-gray-200"
            />

            <button
              type="button"
              onClick={() => {
                setReviewPhotos((current) =>
                  current.filter((_, i) => i !== index)
                );
              }}
              disabled={reviewSubmitting}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Error */}
  {reviewError && !reviewLoading && (
    <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600">
      {reviewError}
    </div>
  )}

  {/* Submit */}
  <button
    type="button"
    disabled={reviewSubmitting}
    onClick={handleSubmitReview}
    className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {reviewSubmitting ? "Submitting your review..." : "Submit review"}
  </button>

  <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
    <ShieldCheck size={14} />
    <span>Your review will be published after approval.</span>
  </div>
</div>

  
</section>
      
    </div>
  );
}
