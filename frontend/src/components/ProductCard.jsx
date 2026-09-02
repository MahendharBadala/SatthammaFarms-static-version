import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import {
  Plus,
  PlayCircle,
  Leaf,
  ShieldCheck,
  HandHeart,
} from "@phosphor-icons/react";
import { resolveMediaUrl } from "./MediaUploader";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { add } = useCart();

  const [touchPreview, setTouchPreview] = useState(false);
  const longPressTimer = useRef(null);
  const longPressed = useRef(false);

  const testId = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  const goToProduct = () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }

    navigate(`/products/${product.id}`);
  };

  const startLongPress = (e) => {
    if (e.pointerType !== "touch") return;

    longPressed.current = false;

    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setTouchPreview(true);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const closeTouchPreview = () => {
    cancelLongPress();
    setTouchPreview(false);
  };

  const addToCart = (e) => {
    e.stopPropagation();
    add(product);
    toast.success(`Added ${product.name} to cart`);
  };

  return (
    <div
      data-testid={`product-card-${testId}`}
      role="link"
      tabIndex={0}
      onClick={goToProduct}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToProduct();
        }
      }}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={(e) => e.preventDefault()}
      className="
        card-earth
        h-full
        overflow-hidden
        group
        flex
        flex-col
        cursor-pointer
        relative
        transition-all
        duration-300
        ease-out
        md:hover:scale-[1.02]
        md:hover:shadow-xl
        md:hover:-translate-y-1
      "
    >
      {/* IMAGE */}
      <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-cream2">

        <img
          src={
            resolveMediaUrl(product.image_url) ||
            "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?auto=format&fit=crop&w=1200&q=80"
          }
          alt={product.name}
          loading="lazy"
          className="
            w-full
            h-full
            object-cover
            transition-transform
            duration-500
            ease-out
            group-hover:scale-105
          "
        />

        {product.video_url && (
          <div className="absolute top-3 left-3 chip !bg-white/90 !text-forest">
            <PlayCircle size={14} weight="duotone" />
            Video
          </div>
        )}

        {product.featured && (
          <div className="absolute top-3 right-3 chip">
            Featured
          </div>
        )}

        {/* HOVER / LONG-PRESS INFORMATION OVERLAY */}
        <div
          className={`
            absolute inset-0
            flex items-end
            bg-gradient-to-t
            from-black/75
            via-black/20
            to-transparent
            transition-opacity
            duration-300
            pointer-events-none

            opacity-0
            group-hover:opacity-100

            ${touchPreview ? "opacity-100" : ""}
          `}
        >
          <div className="w-full p-4 text-white">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
              {product.category}
            </div>

            <h3 className="
                           mt-1
                           font-serif
                           text-lg
                           sm:text-2xl
                           leading-tight
                           text-ink
                           line-clamp-2
                           min-h-[3rem]
                           sm:min-h-[3.75rem]">
                           {product.name}
            </h3>

            <p className="
                          mt-2
                          text-xs
                          sm:text-sm
                          text-muted2
                          line-clamp-2
                          min-h-[2.5rem]
                          sm:min-h-[2.75rem]
                          flex-1">
                         {product.description}
          </p>

            <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
              <Leaf size={15} />
              Organic
              <span className="opacity-50">•</span>
              <ShieldCheck size={15} />
              No Chemicals
            </div>
          </div>
        </div>
      </div>

      {/* NORMAL CARD DETAILS */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col">

        <div className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-terracotta">
          {product.category}
        </div>

        <h3 className="mt-1 font-serif text-lg sm:text-2xl leading-tight text-ink group-hover:text-forest transition-colors">
          {product.name}
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-muted2 line-clamp-2 flex-1">
          {product.description}
        </p>

        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <div className="font-serif text-lg sm:text-2xl text-forest font-semibold">
              ₹{product.price}
            </div>

            <div className="text-[10px] sm:text-[11px] text-muted2 -mt-1">
              per {product.unit}
            </div>
          </div>

          <button
            data-testid={`add-to-cart-${testId}`}
            onClick={addToCart}
            className="btn-primary !py-2 !px-3 text-xs sm:text-sm inline-flex items-center gap-1 shrink-0"
          >
            <Plus size={16} weight="bold" />
            Cart
          </button>
        </div>
      </div>

      {/* LONG-PRESS DISMISS AREA */}
      {touchPreview && (
        <button
          type="button"
          aria-label="Close product preview"
          onClick={(e) => {
            e.stopPropagation();
            closeTouchPreview();
          }}
          className="absolute inset-0 z-20 bg-transparent"
        />
      )}
    </div>
  );
}
