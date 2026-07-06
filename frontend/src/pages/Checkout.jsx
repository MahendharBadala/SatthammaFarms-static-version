import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useSite } from "../context/SiteContext";
import { toast } from "sonner";
import { WhatsappLogo, Info, CheckCircle } from "@phosphor-icons/react";
import { resolveMediaUrl } from "../components/MediaUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function buildWhatsAppMessage({ orderId, customerName, phone, pincode, address, notes, items, subtotal, discount, coupon, total }) {
  const lines = [];
  lines.push("*New order · Satthamma Farms*");
  if (orderId) lines.push(`Order ID: ${orderId.slice(-8).toUpperCase()}`);
  lines.push("");
  lines.push("*Items*");
  items.forEach((i) => {
    lines.push(`• ${i.name} × ${i.quantity} — ₹${i.price * i.quantity}`);
  });
  lines.push("");
  lines.push(`Subtotal: ₹${subtotal}`);
  if (coupon) lines.push(`Coupon (${coupon}): − ₹${discount}`);
  lines.push(`*Total: ₹${total}*`);
  lines.push("");
  lines.push("*Delivery*");
  lines.push(`Name: ${customerName}`);
  lines.push(`Phone: ${phone}`);
  if (pincode) lines.push(`Pincode: ${pincode}`);
  lines.push(`Address: ${address}`);
  if (notes) lines.push(`Notes: ${notes}`);
  lines.push("");
  lines.push("Please confirm my order. Thank you!");
  return lines.join("\n");
}

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { site } = useSite();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponErr, setCouponErr] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // {orderId, waUrl, total}

  if (items.length === 0 && !done) return (
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

  const finalTotal = couponInfo ? couponInfo.new_total : total;
  const discount = couponInfo ? couponInfo.discount_amount : 0;
  const couponCodeApplied = couponInfo ? couponInfo.code : "";

  const placeOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/orders`, {
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        customer_name: customerName,
        phone,
        pincode,
        address,
        notes,
        coupon_code: couponCodeApplied,
      });
      const message = buildWhatsAppMessage({
        orderId: data.id,
        customerName, phone, pincode, address, notes,
        items, subtotal: total, discount, coupon: couponCodeApplied, total: finalTotal,
      });
      const waNumber = (site.whatsapp_number || "918500812044").replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      clear();
      setDone({ orderId: data.id, waUrl, total: finalTotal });
      // Open WhatsApp in new tab (most browsers block a same-tab redirect after async)
      window.open(waUrl, "_blank", "noopener");
    } catch (e2) {
      toast.error(e2?.response?.data?.detail || "Could not submit order");
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="container mx-auto py-20 max-w-lg text-center">
      <CheckCircle size={72} weight="duotone" className="text-forest mx-auto" />
      <h1 className="font-serif text-4xl text-ink mt-4">Order sent to WhatsApp</h1>
      <p className="text-muted2 mt-2">
        Order ID: <span className="font-mono text-ink" data-testid="order-id">{done.orderId.slice(-8).toUpperCase()}</span>
      </p>
      <p className="text-muted2 mt-1">Total: <span className="font-serif text-forest font-semibold">₹{done.total}</span></p>
      <p className="mt-6 text-sm text-muted2">
        We opened WhatsApp with your order details prefilled. If nothing happened, tap the button below to open it manually.
      </p>
      <div className="mt-6 flex gap-3 justify-center">
        <a
          data-testid="reopen-whatsapp"
          href={done.waUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary inline-flex items-center gap-2"
        >
          <WhatsappLogo size={18} weight="duotone" /> Open WhatsApp
        </a>
        <Link to="/products" className="btn-outline">Continue shopping</Link>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-12 grid lg:grid-cols-3 gap-8">
      <form onSubmit={placeOrder} className="lg:col-span-2 card-earth p-8 space-y-4" data-testid="checkout-form">
        <div className="chip">Checkout</div>
        <h1 className="font-serif text-4xl text-ink">Delivery details</h1>

        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Full name</label>
          <input
            data-testid="checkout-name"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Phone</label>
            <input
              data-testid="checkout-phone"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Pincode</label>
            <input
              data-testid="checkout-pincode"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength="6"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit pincode"
              className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Delivery address</label>
          <textarea
            data-testid="checkout-address"
            required
            rows="3"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House / flat / street, area, city, state"
            className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Notes (optional)</label>
          <textarea
            data-testid="checkout-notes"
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-4 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest"
          />
        </div>

        <div data-testid="whatsapp-notice" className="flex gap-3 items-start bg-forest/5 border border-forest/20 rounded-xl p-4">
          <Info size={22} weight="duotone" className="text-forest shrink-0 mt-0.5" />
          <p className="text-sm text-ink/80">
            {site.checkout_whatsapp_note}
          </p>
        </div>

        <button
          data-testid="checkout-place"
          disabled={loading}
          className="btn-primary w-full inline-flex items-center justify-center gap-2 !bg-[#25D366] !border-[#25D366] hover:opacity-90"
        >
          <WhatsappLogo size={20} weight="duotone" />
          {loading ? "Sending..." : `Order via WhatsApp · ₹${finalTotal}`}
        </button>
        <p className="text-xs text-muted2 text-center">
          Your order + contact details will open in WhatsApp, prefilled.
        </p>
      </form>

      <div className="card-earth p-6 h-fit">
        <h3 className="font-serif text-2xl text-ink">Summary</h3>
        <div className="mt-4 space-y-3">
          {items.map((i) => (
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
        <div className="border-t border-edge my-4" />

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
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="HARVEST10"
                  className="flex-1 px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest uppercase text-sm"
                />
                <button
                  type="button"
                  data-testid="coupon-apply"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="btn-outline !py-2 !px-4 text-sm"
                >
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
        <div className="border-t border-edge my-3" />
        <div className="flex justify-between font-serif text-xl text-forest font-semibold">
          <span>Total</span><span data-testid="summary-total">₹{finalTotal}</span>
        </div>
      </div>
    </div>
  );
}
