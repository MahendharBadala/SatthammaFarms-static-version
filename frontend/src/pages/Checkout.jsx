import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { CheckCircle } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user, authHeaders } = useAuth();
  const nav = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");
  const [placed, setPlaced] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user) return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="font-serif text-4xl text-ink">Sign in to checkout</h1>
      <Link to="/login" state={{ from: "/checkout" }} className="btn-primary inline-block mt-6">Sign in</Link>
    </div>
  );

  if (items.length === 0 && !placed) return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="font-serif text-4xl text-ink">Your cart is empty</h1>
      <Link to="/products" className="btn-primary inline-block mt-6">Browse products</Link>
    </div>
  );

  const place = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/orders`, {
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        address, phone, notes,
      }, { headers: authHeaders() });
      setPlaced(data);
      clear();
      toast.success("Order placed! We'll contact you shortly.");
    } catch (e) { toast.error(e?.response?.data?.detail || "Order failed"); }
    finally { setLoading(false); }
  };

  if (placed) return (
    <div className="container mx-auto py-20 max-w-lg text-center">
      <CheckCircle size={72} weight="duotone" className="text-forest mx-auto" />
      <h1 className="font-serif text-4xl text-ink mt-4">Order placed!</h1>
      <p className="text-muted2 mt-2">Order ID: <span className="font-mono text-ink" data-testid="order-id">{placed.id}</span></p>
      <p className="text-muted2 mt-1">Total: <span className="font-serif text-forest font-semibold">₹{placed.total}</span></p>
      <p className="mt-6 text-sm text-muted2">Online payment coming in Phase 2. For now, our team will WhatsApp you shortly on the number you provided to confirm delivery & payment (COD / UPI accepted).</p>
      <div className="mt-8 flex gap-3 justify-center">
        <button onClick={() => nav("/products")} className="btn-outline">Continue shopping</button>
        <button onClick={() => nav("/")} className="btn-primary">Back to home</button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-12 grid lg:grid-cols-3 gap-8">
      <form onSubmit={place} className="lg:col-span-2 card-earth p-8 space-y-4" data-testid="checkout-form">
        <h1 className="font-serif text-4xl text-ink">Checkout</h1>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Delivery address</label>
          <textarea data-testid="checkout-address" required rows="3" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Phone</label>
          <input data-testid="checkout-phone" required value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Notes (optional)</label>
          <textarea data-testid="checkout-notes" rows="2" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest" />
        </div>
        <button data-testid="checkout-place" disabled={loading} className="btn-primary w-full">{loading ? "Placing..." : `Place order · ₹${total}`}</button>
        <p className="text-xs text-muted2 text-center">Payment gateway integration coming in Phase 2. Order will be confirmed via WhatsApp.</p>
      </form>
      <div className="card-earth p-6 h-fit">
        <h3 className="font-serif text-2xl text-ink">Summary</h3>
        <div className="mt-4 space-y-3">
          {items.map(i => (
            <div key={i.id} className="flex gap-3 text-sm">
              <img src={i.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-ink font-serif text-base">{i.name}</div>
                <div className="text-muted2 text-xs">₹{i.price} × {i.quantity}</div>
              </div>
              <div className="font-serif text-forest">₹{i.price * i.quantity}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-edge my-4"></div>
        <div className="flex justify-between font-serif text-xl text-forest font-semibold"><span>Total</span><span>₹{total}</span></div>
      </div>
    </div>
  );
}
