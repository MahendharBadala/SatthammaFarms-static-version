import React, { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);

const KEY = "sf_cart";

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

// Gives each product-weight combination a unique identity.
export const getCartItemKey = (item) => {
  return item.cart_key || `${item.id}__${item.variant_weight_grams || "default"}`;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (product, qty = 1, variant = null) => {
    const weightGrams = variant?.weight_grams ?? null;
    const cartKey = `${product.id}__${weightGrams || "default"}`;

    setItems((prev) => {
      const existing = prev.find(
        (item) => getCartItemKey(item) === cartKey
      );

      if (existing) {
        return prev.map((item) =>
          getCartItemKey(item) === cartKey
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [
        ...prev,
        {
          cart_key: cartKey,
          id: product.id,
          name: product.name,
          price: variant ? variant.price : product.price,
          mrp: variant?.mrp ?? null,
          image_url: product.image_url,
          unit: variant?.weight_label || product.unit,
          weight_label: variant?.weight_label || null,
          variant_weight_grams: weightGrams,
          quantity: qty,
        },
      ];
    });
  };

  const remove = (cartKey) => {
    setItems((prev) =>
      prev.filter((item) => getCartItemKey(item) !== cartKey)
    );
  };

  const update = (cartKey, qty) => {
    setItems((prev) =>
      prev.map((item) =>
        getCartItemKey(item) === cartKey
          ? { ...item, quantity: Math.max(1, qty) }
          : item
      )
    );
  };

  const clear = () => setItems([]);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <CartCtx.Provider
      value={{ items, add, remove, update, clear, count, total }}
    >
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
