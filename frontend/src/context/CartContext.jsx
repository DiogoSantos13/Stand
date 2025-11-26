import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const json = localStorage.getItem("cart");
    return json ? JSON.parse(json) : [];
  });

  const addToCart = product => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      let next;
      if (existing) {
        next = prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        next = [...prev, { product, quantity: 1 }];
      }
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  };

  const removeFromCart = productId => {
    setItems(prev => {
      const next = prev.filter(i => i.product.id !== productId);
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems(prev => {
      const next = prev.map(i =>
        i.product.id === productId ? { ...i, quantity: Number(quantity) } : i
      );
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.product.preco * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
