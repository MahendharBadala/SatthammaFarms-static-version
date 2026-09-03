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
  
    useEffect(() => {
    let cancelled = false;

    setReviewLoading(true);
    setReviewError("");
    setReviewsData(null);

    fetchProductReviews(id)
      .then((data) => {
        if (cancelled) return;
        setReviewsData(data);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("Product reviews error:", err);

        setReviewError(
          err?.response?.data?.detail ||
          "Unable to load reviews."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setReviewLoading(false);
        }
      });

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
    
    const averageRating = reviewsData?.rating ?? 5.0;
    const reviewCount = reviewsData?.review_count ?? 0;
    const reviewList = reviewsData?.reviews ?? [];
    const reviewDistribution = reviewsData?.distribution ?? {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0,
    };

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
  <div className="flex items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">
        Customer Reviews
      </h2>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-yellow-500 text-xl">
          {"★".repeat(Math.round(averageRating))}
        </span>

        <span className="font-semibold text-gray-900">
          {averageRating.toFixed(1)}
        </span>

        <span className="text-gray-500">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
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
    <div className="space-y-5">
      {reviewList.map((review) => (
        <div
          key={review.id}
          className="border rounded-xl p-5 bg-white"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                {review.customer_name}
              </p>

              <div className="text-yellow-500 mt-1">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>
            </div>

            <span className="text-sm text-gray-400">
              {review.created_at
                ? new Date(review.created_at).toLocaleDateString()
                : ""}
            </span>
          </div>

          {review.review_text && (
            <p className="mt-3 text-gray-700 whitespace-pre-wrap">
              {review.review_text}
            </p>
          )}

          {review.photo_urls?.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {review.photo_urls.map((photo, index) => (
                <img
                  key={`${review.id}-photo-${index}`}
                  src={photo}
                  alt={`Customer review ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg border"
                />
              ))}
            </div>
          )}

          {review.admin_response && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="font-semibold text-gray-800">
                Satthamma Farms
              </p>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                {review.admin_response}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )}

  {/* Write a Review */}
<div className="mt-10 rounded-2xl border bg-gray-50 p-5 sm:p-6">
  <h3 className="text-xl font-bold text-gray-900">
    Write a Review
  </h3>

  <p className="mt-1 text-sm text-gray-500">
    Share your experience with this product.
  </p>

  <form
    onSubmit={handleSubmitReview}
    className="mt-6 space-y-5"
  >
    {/* Customer Name */}
    <div>
      <label
        htmlFor="review-name"
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Your Name
      </label>

      <input
        id="review-name"
        type="text"
        value={reviewName}
        onChange={(e) => setReviewName(e.target.value)}
        placeholder="Enter your name"
        maxLength={100}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />
    </div>

    {/* Rating */}
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        Your Rating
      </label>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewRating(star)}
            aria-label={`Rate ${star} out of 5`}
            className="text-3xl leading-none transition-transform hover:scale-110"
          >
            <span
              className={
                star <= reviewRating
                  ? "text-yellow-500"
                  : "text-gray-300"
              }
            >
              ★
            </span>
          </button>
        ))}

        <span className="ml-2 text-sm font-medium text-gray-600">
          {reviewRating}/5
        </span>
      </div>
    </div>

    {/* Review Text */}
    <div>
      <label
        htmlFor="review-text"
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Your Review
      </label>

      <textarea
        id="review-text"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Tell us about your experience..."
        maxLength={2000}
        rows={5}
        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />

      <div className="mt-1 text-right text-xs text-gray-400">
        {reviewText.length}/2000
      </div>
    </div>

    {/* Photos */}
    <div>
      <label
        htmlFor="review-photos"
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Add Photos <span className="font-normal text-gray-400">(optional)</span>
      </label>

      <input
        id="review-photos"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleReviewPhotoChange}
        disabled={reviewPhotos.length >= 4}
        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:text-sm file:font-medium"
      />

      <p className="mt-1 text-xs text-gray-500">
        You can upload up to 4 photos.
      </p>

      {/* Selected Photo Preview */}
      {reviewPhotos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {reviewPhotos.map((photo, index) => (
            <div
              key={`${photo}-${index}`}
              className="relative overflow-hidden rounded-lg border bg-white"
            >
              <img
                src={photo}
                alt={`Review upload ${index + 1}`}
                className="h-28 w-full object-cover"
              />

              <button
                type="button"
                onClick={() => {
                  setReviewPhotos((previous) =>
                    previous.filter(
                      (_, photoIndex) => photoIndex !== index
                    )
                  );
                }}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm text-white hover:bg-black"
                aria-label={`Remove photo ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Error */}
    {reviewError && (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {reviewError}
      </div>
    )}

    {/* Submit */}
    <button
      type="submit"
      disabled={reviewSubmitting}
      className="w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {reviewSubmitting ? "Submitting..." : "Submit Review"}
    </button>

    <p className="text-xs text-gray-500">
      Your review will be published after approval.
    </p>
  </form>
</div>

  
</section>
      
    </div>
  );
}
