import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { ArrowLeft, Plus, Minus, Leaf, ShieldCheck, HandHeart } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  useEffect(() => { axios.get(`${API}/products/${id}`).then(r => setProduct(r.data)); }, [id]);
  if (!product) return <div className="container mx-auto py-20 text-center text-muted2">Loading...</div>;

  return (
    <div className="container mx-auto py-10">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-forest mb-6"><ArrowLeft size={16} /> Back to products</Link>
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="card-earth overflow-hidden aspect-[4/3]">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.video_url && (
            <div className="mt-4 card-earth overflow-hidden aspect-video">
              <video controls src={product.video_url} className="w-full h-full object-cover" data-testid="product-video" />
            </div>
          )}
        </div>
        <div>
          <div className="chip">{product.category}</div>
          <h1 className="font-serif text-5xl mt-2 text-ink">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-4xl text-forest font-semibold">₹{product.price}</span>
            <span className="text-muted2 text-sm">/ {product.unit}</span>
          </div>
          <p className="mt-5 text-muted2 leading-relaxed">{product.description}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Leaf, label: "Organic" },
              { icon: ShieldCheck, label: "No Chemicals" },
              { icon: HandHeart, label: "Hand-picked" },
            ].map(b => (
              <div key={b.label} className="card-earth p-3 flex items-center gap-2">
                <b.icon size={22} weight="duotone" className="text-terracotta" />
                <span className="text-xs font-semibold text-ink">{b.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-edge rounded-full bg-white">
              <button data-testid="qty-decrease" onClick={() => setQty(q => Math.max(1, q - 1))} className="p-3 hover:bg-cream2 rounded-l-full"><Minus size={16} /></button>
              <span data-testid="qty-value" className="px-5 font-semibold">{qty}</span>
              <button data-testid="qty-increase" onClick={() => setQty(q => q + 1)} className="p-3 hover:bg-cream2 rounded-r-full"><Plus size={16} /></button>
            </div>
            <button data-testid="detail-add-to-cart" onClick={() => { add(product, qty); toast.success(`Added ${qty} × ${product.name}`); }} className="btn-primary flex-1">Add to cart · ₹{product.price * qty}</button>
          </div>
          <div className="mt-6 text-xs text-muted2">In stock: {product.stock} {product.unit}</div>
        </div>
      </div>
    </div>
  );
}
