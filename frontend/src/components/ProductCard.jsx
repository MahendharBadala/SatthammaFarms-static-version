import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { Plus, PlayCircle } from "@phosphor-icons/react";
import { resolveMediaUrl } from "./MediaUploader";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const testId = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div data-testid={`product-card-${testId}`} className="card-earth overflow-hidden group flex flex-col">
      <Link to={`/products/${product.id}`} className="block relative aspect-[4/3] overflow-hidden bg-cream2">
        <img
          src={resolveMediaUrl(product.image_url) || "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?auto=format&fit=crop&w=1200&q=80"}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
        {product.video_url && (
          <div className="absolute top-3 left-3 chip !bg-white/90 !text-forest">
            <PlayCircle size={14} weight="duotone" /> Video
          </div>
        )}
        {product.featured && (
          <div className="absolute top-3 right-3 chip">Featured</div>
        )}
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-terracotta">{product.category}</div>
        <Link to={`/products/${product.id}`}>
          <h3 className="mt-1 font-serif text-2xl leading-tight text-ink hover:text-forest transition-colors">{product.name}</h3>
        </Link>
        <p className="mt-2 text-sm text-muted2 line-clamp-2 flex-1">{product.description}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="font-serif text-2xl text-forest font-semibold">₹{product.price}</div>
            <div className="text-[11px] text-muted2 -mt-1">per {product.unit}</div>
          </div>
          <button
            data-testid={`add-to-cart-${testId}`}
            onClick={(e) => { e.preventDefault(); add(product); toast.success(`Added ${product.name} to cart`); }}
            className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-1"
          >
            <Plus size={16} weight="bold" /> Cart
          </button>
        </div>
      </div>
    </div>
  );
}
