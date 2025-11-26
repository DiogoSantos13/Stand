import { createContext, useContext, useState } from "react";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    const json = localStorage.getItem("favorites");
    return json ? JSON.parse(json) : [];
  });

  const isFavorite = productId => favorites.some(f => f.id === productId);

  const toggleFavorite = product => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === product.id);
      let next;
      if (exists) next = prev.filter(f => f.id !== product.id);
      else next = [...prev, product];
      localStorage.setItem("favorites", JSON.stringify(next));
      return next;
    });
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
