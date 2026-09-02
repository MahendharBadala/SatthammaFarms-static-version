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
    </div>
  );
}
