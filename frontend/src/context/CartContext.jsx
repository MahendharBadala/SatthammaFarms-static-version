import React, { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);
const KEY = "sf_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const add = (product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_url, unit: product.unit, quantity: qty }];
    });
  };
  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const update = (id, qty) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, update, clear, count, total }}>
      {children}
    </CartCtx.Provider>
  );
}
export const useCart = () => useContext(CartCtx);
