import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { CheckCircle, DeviceMobile, Copy } from "@phosphor-icons/react";
import { resolveMediaUrl } from "../components/MediaUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UPI_APPS = [
  { name: "Google Pay", scheme: "tez", color: "#4285F4" },
  { name: "PhonePe", scheme: "phonepe", color: "#5f259f" },
  { name: "Paytm", scheme: "paytmmp", color: "#00baf2" },
  { name: "BHIM", scheme: "bhim", color: "#00A950" },
  { name: "Amazon Pay", scheme: "amazonpay", color: "#FF9900" },
];

const buildUpiUri = ({ vpa, name, amount, ref, note }) => {
  const params = new URLSearchParams({
    pa: vpa, pn: name, am: Number(amount).toFixed(2), cu: "INR", tr: ref, tn: note,
  });
  return `upi://pay?${params.toString()}`;
};

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState("form"); // form | pay | done
  const [order, setOrder] = useState(null);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null); // {code, discount_amount, new_total}
  const [couponErr, setCouponErr] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => { axios.get(`${API}/payments/settings`).then(r => setSettings(r.data)); }, []);

  if (!user) return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="font-serif text-4xl text-ink">Sign in to checkout</h1>
      <Link to="/login" state={{ from: "/checkout" }} className="btn-primary inline-block mt-6">Sign in</Link>
    </div>
  );

  if (items.length === 0 && step === "form") return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="font-serif text-4xl text-ink">Your cart is empty</h1>
      <Link to="/products" className="btn-primary inline-block mt-6">Browse products</Link>
    </div>
  );

  const applyCoupon = async () => {
    setCouponErr("");
    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponErr("Enter a coupon code"); return; }
    setCouponLoading(true);
    try {
      const { data } = await axios.post(`${API}/coupons/validate`, { code, cart_total: total });
      setCouponInfo(data);
      toast.success(`Coupon applied — you save ₹${data.discount_amount}`);
    } catch (e) {
      setCouponInfo(null);
      setCouponErr(e?.response?.data?.detail || "Invalid coupon");
    } finally { setCouponLoading(false); }
  };
  const removeCoupon = () => { setCouponInfo(null); setCouponCode(""); setCouponErr(""); };

  const place = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/orders`, {
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        address, phone, notes,
        coupon_code: couponInfo ? couponInfo.code : "",
      });
      setOrder({ ...data, address, phone });
      clear();
      setStep("pay");
    } catch (e2) { toast.error(e2?.response?.data?.detail || "Order failed"); }
    finally { setLoading(false); }
  };

  const confirmPaid = async () => {
    if (!order) return;
    setLoading(true);
    try {
      await axios.post(`${API}/orders/${order.id}/confirm-payment`, { utr: utr.trim(), method: "upi" });
      toast.success("Thanks! Our team will verify your payment shortly.");
      setStep("done");
    } catch (e) { toast.error(e?.response?.data?.detail || "Could not record payment"); }
    finally { setLoading(false); }
  };

  const upiUri = order && settings ? buildUpiUri({
    vpa: settings.upi_vpa, name: settings.payee_name, amount: order.total,
    ref: `SF${order.id.slice(-10).toUpperCase()}`, note: `Satthamma Farms order ${order.id.slice(-6)}`,
  }) : "";

  const copyVpa = () => {
    if (settings?.upi_vpa) {
      navigator.clipboard.writeText(settings.upi_vpa);
      toast.success("UPI ID copied");
    }
  };

  if (step === "done") return (
    <div className="container mx-auto py-20 max-w-lg text-center">
      <CheckCircle size={72} weight="duotone" className="text-forest mx-auto" />
      <h1 className="font-serif text-4xl text-ink mt-4">Payment recorded!</h1>
      <p className="text-muted2 mt-2">Order ID: <span className="font-mono text-ink" data-testid="order-id">{order.id.slice(-8).toUpperCase()}</span></p>
      <p className="text-muted2 mt-1">Amount: <span className="font-serif text-forest font-semibold">₹{order.total}</span></p>
      {utr && <p className="text-muted2 mt-1">UTR: <span className="font-mono text-ink">{utr}</span></p>}
      <p className="mt-6 text-sm text-muted2">Our team will verify your payment via bank statement (usually within a few hours) and start preparing your harvest for shipping. You can track status in <Link to="/orders" className="text-forest font-semibold">My Orders</Link>.</p>
      <div className="mt-8 flex gap-3 justify-center">
        <button onClick={() => nav("/orders")} className="btn-outline">My orders</button>
        <button onClick={() => nav("/products")} className="btn-primary">Continue shopping</button>
      </div>
    </div>
  );

  if (step === "pay" && order && settings) return (
    <div className="container mx-auto py-12 max-w-2xl">
      <div className="card-earth p-8" data-testid="upi-payment-panel">
        <div className="chip">Pay with UPI</div>
        <h1 className="font-serif text-4xl text-ink mt-2">Complete your payment</h1>
        <p className="text-muted2 mt-2">Order <span className="font-mono text-ink">{order.id.slice(-8).toUpperCase()}</span> · Amount <span className="font-serif text-forest font-semibold">₹{order.total}</span></p>

        <div className="grid md:grid-cols-[220px,1fr] gap-6 mt-6">
          <div className="p-4 bg-white border border-edge rounded-xl text-center">
            <QRCodeCanvas value={upiUri} size={180} level="M" data-testid="upi-qr" />
            <p className="text-xs text-muted2 mt-3">Scan with any UPI app</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted2">On mobile? Tap an app to pay directly:</p>
            <div className="grid grid-cols-2 gap-2">
              <a href={upiUri} data-testid="upi-open-any" className="btn-primary inline-flex items-center justify-center gap-2 col-span-2 !py-3">
                <DeviceMobile size={18} weight="duotone" /> Open UPI app
              </a>
              {UPI_APPS.map(app => (
                <a key={app.name} href={upiUri} data-testid={`upi-app-${app.scheme}`}
                  className="text-sm border border-edge rounded-full px-3 py-2 hover:bg-cream2 transition-colors text-center font-semibold"
                  style={{ color: app.color }}>
                  {app.name}
                </a>
              ))}
            </div>
            <div className="mt-3 p-3 bg-cream2 rounded-lg text-sm">
              <div className="text-xs uppercase tracking-widest text-muted2">UPI ID</div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-ink" data-testid="upi-vpa">{settings.upi_vpa}</span>
                <button onClick={copyVpa} data-testid="upi-copy" className="text-forest hover:text-terracotta"><Copy size={16} /></button>
              </div>
              <div className="text-xs text-muted2 mt-1">Payee: {settings.payee_name}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-edge pt-6">
          <h3 className="font-serif text-2xl text-ink">After you pay</h3>
          <p className="text-sm text-muted2 mt-1">{settings.instructions}</p>
          <label className="block mt-4 text-xs font-semibold text-muted2 uppercase tracking-widest">UTR / transaction reference (optional)</label>
          <input data-testid="upi-utr" value={utr} onChange={e => setUtr(e.target.value)} placeholder="12-digit UTR from your UPI app" className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest" />
          <button onClick={confirmPaid} disabled={loading} data-testid="upi-confirm-paid" className="btn-primary w-full mt-4">
            {loading ? "Recording..." : "I have paid"}
          </button>
        </div>
      </div>
    </div>
  );

  const finalTotal = couponInfo ? couponInfo.new_total : total;

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
        <button data-testid="checkout-place" disabled={loading} className="btn-primary w-full">{loading ? "Placing..." : `Continue to UPI · ₹${finalTotal}`}</button>
        <p className="text-xs text-muted2 text-center">Pay with any UPI app · GPay, PhonePe, Paytm, BHIM & more.</p>
      </form>
      <div className="card-earth p-6 h-fit">
        <h3 className="font-serif text-2xl text-ink">Summary</h3>
        <div className="mt-4 space-y-3">
          {items.map(i => (
            <div key={i.id} className="flex gap-3 text-sm">
              <img src={resolveMediaUrl(i.image_url)} alt="" className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-ink font-serif text-base">{i.name}</div>
                <div className="text-muted2 text-xs">₹{i.price} × {i.quantity}</div>
              </div>
              <div className="font-serif text-forest">₹{i.price * i.quantity}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-edge my-4"></div>
        {/* Coupon */}
        <div data-testid="coupon-panel" className="mb-4">
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Coupon code</label>
          {couponInfo ? (
            <div className="mt-1 flex items-center justify-between bg-forest/5 border border-forest/20 rounded-lg px-3 py-2">
              <div>
                <div className="font-mono text-sm text-forest" data-testid="coupon-applied-code">{couponInfo.code}</div>
                <div className="text-xs text-muted2">You save ₹{couponInfo.discount_amount}</div>
              </div>
              <button type="button" data-testid="coupon-remove" onClick={removeCoupon} className="text-xs text-terracotta hover:underline">Remove</button>
            </div>
          ) : (
            <>
              <div className="mt-1 flex gap-2">
                <input
                  data-testid="coupon-input"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="HARVEST10"
                  className="flex-1 px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest uppercase text-sm"
                />
                <button type="button" data-testid="coupon-apply" onClick={applyCoupon} disabled={couponLoading} className="btn-outline !py-2 !px-4 text-sm">
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
              {couponErr && <p data-testid="coupon-error" className="text-xs text-terracotta mt-1">{couponErr}</p>}
            </>
          )}
        </div>
        <div className="flex justify-between text-sm text-muted2"><span>Subtotal</span><span>₹{total}</span></div>
        {couponInfo && (
          <div className="flex justify-between text-sm text-forest mt-1" data-testid="summary-discount">
            <span>Discount ({couponInfo.code})</span><span>− ₹{couponInfo.discount_amount}</span>
          </div>
        )}
        <div className="border-t border-edge my-3"></div>
        <div className="flex justify-between font-serif text-xl text-forest font-semibold"><span>Total</span><span data-testid="summary-total">₹{finalTotal}</span></div>
      </div>
    </div>
  );
}
