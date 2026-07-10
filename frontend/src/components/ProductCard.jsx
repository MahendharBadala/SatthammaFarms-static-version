import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { Plus, PlayCircle, X, Leaf, ShieldCheck, HandHeart } from "@phosphor-icons/react";
import { resolveMediaUrl } from "./MediaUploader";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const testId = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const openQuickView = () => setOpen(true);

  return (
    <>
      <div
        data-testid={`product-card-${testId}`}
        onClick={openQuickView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openQuickView(); }}
        className="card-earth overflow-hidden group flex flex-col cursor-pointer transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1"
      >
        <div className="block relative aspect-[4/3] overflow-hidden bg-cream2">
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
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-terracotta">{product.category}</div>
          <h3 className="mt-1 font-serif text-2xl leading-tight text-ink group-hover:text-forest transition-colors">{product.name}</h3>
          <p className="mt-2 text-sm text-muted2 line-clamp-2 flex-1">{product.description}</p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="font-serif text-2xl text-forest font-semibold">₹{product.price}</div>
              <div className="text-[11px] text-muted2 -mt-1">per {product.unit}</div>
            </div>
            <button
              data-testid={`add-to-cart-${testId}`}
              onClick={(e) => { e.stopPropagation(); add(product); toast.success(`Added ${product.name} to cart`); }}
              className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-1"
            >
              <Plus size={16} weight="bold" /> Cart
            </button>
          </div>
        </div>
      </div>

      {open && (
        <ProductQuickView product={product} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ProductQuickView({ product, onClose }) {
  const { add } = useCart();
  const testId = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div
      data-testid={`quickview-${testId}`}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto shadow-2xl relative animate-[quickViewIn_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          data-testid="quickview-close"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 border border-edge flex items-center justify-center hover:bg-cream2"
        >
          <X size={18} />
        </button>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="aspect-[4/3] md:aspect-auto md:h-full bg-cream2 overflow-hidden">
            <img
              src={resolveMediaUrl(product.image_url) || "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?auto=format&fit=crop&w=1200&q=80"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 md:p-8">
            <div className="chip">{product.category}</div>
            <h2 className="font-serif text-3xl md:text-4xl mt-3 text-ink leading-tight">{product.name}</h2>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-3xl text-forest font-semibold">₹{product.price}</span>
              <span className="text-muted2 text-sm">/ {product.unit}</span>
            </div>
            {/* Full, untruncated description — this is the "readable full details" view */}
            <p className="mt-5 text-muted2 leading-relaxed" data-testid="quickview-description">{product.description}</p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: Leaf, label: "Organic" },
                { icon: ShieldCheck, label: "No Chemicals" },
                { icon: HandHeart, label: "Hand-picked" },
              ].map(b => (
                <div key={b.label} className="card-earth p-2.5 flex flex-col items-center text-center gap-1">
                  <b.icon size={20} weight="duotone" className="text-terracotta" />
                  <span className="text-[11px] font-semibold text-ink">{b.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                data-testid="quickview-add-to-cart"
                onClick={() => { add(product); toast.success(`Added ${product.name} to cart`); }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} weight="bold" /> Add to cart
              </button>
              <Link to={`/products/${product.id}`} data-testid="quickview-full-page-link" className="btn-outline">
                View full page
              </Link>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes quickViewIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
