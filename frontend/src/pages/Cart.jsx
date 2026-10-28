import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash, Plus, Minus, ShoppingBagOpen } from "@phosphor-icons/react";
import { resolveMediaUrl } from "../components/MediaUploader";
import { useLanguage } from "../context/LanguageContext";

export default function Cart() {
  const { items, update, remove, total, clear } = useCart();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-24 text-center">
        <ShoppingBagOpen size={64} weight="duotone" className="text-terracotta mx-auto" />
        <h1 className="font-serif text-4xl mt-4 text-ink">{t("basketisEmpty")}</h1>
        <p className="text-muted2 mt-2">{t("exploreHarvest")}.</p>
        <Link to="/products" data-testid="cart-empty-shop" className="btn-primary mt-6 inline-block">{t("browseProducts")}</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="font-serif text-5xl text-ink">{t("yourCart")}</h1>
      <p className="text-muted2 mt-1">{t("reviewHarvest")}</p>
      <div className="grid lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="card-earth p-4 flex gap-4" data-testid={`cart-item-${item.id}`}>
              <img src={resolveMediaUrl(item.image_url)} alt={item.name} className="w-24 h-24 object-cover rounded-xl" />
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between">
                  <h3 className="font-serif text-xl text-ink">{item.name}</h3>
                  <button data-testid={`cart-remove-${item.id}`} onClick={() => remove(item.id)} className="text-muted2 hover:text-terracotta"><Trash size={18} /></button>
                </div>
                <div className="text-xs text-muted2">₹{item.price} per {item.unit}</div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center border border-edge rounded-full bg-white">
                    <button onClick={() => update(item.id, item.quantity - 1)} className="p-2 hover:bg-cream2 rounded-l-full"><Minus size={14} /></button>
                    <span className="px-4 text-sm font-semibold" data-testid={`cart-qty-${item.id}`}>{item.quantity}</span>
                    <button onClick={() => update(item.id, item.quantity + 1)} className="p-2 hover:bg-cream2 rounded-r-full"><Plus size={14} /></button>
                  </div>
                  <div className="font-serif text-xl text-forest font-semibold">₹{item.price * item.quantity}</div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={clear} className="text-sm text-muted2 hover:text-terracotta">{t("clearCart")}</button>
        </div>
        <div className="card-earth p-6 h-fit sticky top-24">
          <h3 className="font-serif text-2xl text-ink">{t("orderSummary")}</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted2"><span>{t("subtotal")}</span><span data-testid="cart-subtotal">₹{total}</span></div>
            <div className="flex justify-between text-muted2"><span>{t("delivery")}</span><span>{t("calculatedAtCheckout")}</span></div>
          </div>
          <div className="border-t border-edge my-4"></div>
          <div className="flex justify-between font-serif text-2xl text-forest font-semibold"><span>{t("total")}</span><span data-testid="cart-total">₹{total}</span></div>
          <Link to="/checkout" data-testid="cart-checkout-btn" className="btn-primary w-full text-center block mt-6">{t("proceedtoCheckout")}</Link>
          <Link to="/products" className="text-sm text-muted2 hover:text-forest block text-center mt-4">{t("continueShopping")}</Link>
        </div>
      </div>
    </div>
  );
}
