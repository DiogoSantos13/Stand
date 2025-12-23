/**
 * CartContext.jsx
 *
 * Contexto do carrinho:
 * - Guarda itens no estado e no localStorage
 * - Calcula total
 * - CORREÇÃO: se o localStorage estiver corrompido, garante que "items" é sempre um array
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  function addToCart(product) {
    // Se não houver stock, não adiciona
    if (!product || (Number(product.stock) || 0) <= 0) return;

    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId) {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }

  function updateQuantity(productId, quantity) {
    const q = Number(quantity) || 1;
    setItems(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, quantity: q } : i))
    );
  }

  function clearCart() {
    setItems([]);
  }

  const total = useMemo(() => {
    // Garantia extra: se "items" não for array por algum motivo, não rebenta
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, i) => sum + i.product.preco * i.quantity, 0);
  }, [items]);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
