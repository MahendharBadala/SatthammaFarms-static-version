import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Package } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_META = {
  pending: { label: "Pending payment", color: "bg-gold/20 text-gold" },
  payment_pending_verification: { label: "Verifying payment", color: "bg-terracotta/20 text-terracotta" },
  paid: { label: "Paid", color: "bg-forest/15 text-forest" },
  packed: { label: "Packed", color: "bg-forest/15 text-forest" },
  shipped: { label: "Shipped", color: "bg-forest/15 text-forest" },
  delivered: { label: "Delivered", color: "bg-forest text-cream" },
  cancelled: { label: "Cancelled", color: "bg-destructive/15 text-destructive" },
};

export default function MyOrders() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    if (user) axios.get(`${API}/orders/mine`).then(r => setOrders(r.data));
  }, [user]);
  if (loading) return <div className="container mx-auto py-20 text-center text-muted2">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: "/orders" }} replace />;

  return (
    <div className="container mx-auto py-12">
      <div className="chip">Your journey</div>
      <h1 className="font-serif text-5xl text-ink mt-2">My Orders</h1>
      <p className="text-muted2 mt-1">All your harvest orders — most recent first.</p>
      {orders.length === 0 ? (
        <div className="mt-16 text-center text-muted2">
          <Package size={48} weight="duotone" className="mx-auto text-terracotta" />
          <p className="mt-4">No orders yet.</p>
          <Link to="/products" className="btn-primary inline-block mt-4">Browse products</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4" data-testid="my-orders-list">
          {orders.map((o, idx) => {
            const meta = STATUS_META[o.status] || STATUS_META.pending;
            return (
              <div key={o.id} className="card-earth p-5" data-testid={`my-order-${o.id}`}>
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <div className="text-xs text-muted2">#{orders.length - idx} · {new Date(o.created_at).toLocaleString()}</div>
                    <div className="font-serif text-xl text-ink">Order {o.id.slice(-8).toUpperCase()}</div>
                    <div className="text-sm text-muted2 mt-1">Delivery: {o.address}</div>
                    <div className="text-sm text-muted2">Phone: {o.phone}</div>
                    {o.payment_utr && <div className="text-sm text-muted2">Payment UTR: <span className="font-mono">{o.payment_utr}</span></div>}
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-2xl text-forest">₹{o.total}</div>
                    <span className={`chip ${meta.color}`} data-testid={`order-status-${o.id}`}>{meta.label}</span>
                  </div>
                </div>
                <div className="mt-3 border-t border-edge pt-3 text-sm text-muted2">
                  {o.items.map((i, ii) => (
                    <div key={`${i.product_id}-${ii}`} className="flex justify-between py-1">
                      <span>{i.name} × {i.quantity}</span>
                      <span>₹{i.line_total}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { STATUS_META };
