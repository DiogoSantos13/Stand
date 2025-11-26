import ProductCard from "../components/ProductCard";
import { useFavorites } from "../context/FavoritesContext";

function Favorites() {
  const { favorites } = useFavorites();

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Favoritos</h2>
          <p className="page-subtitle">
            Guarda aqui as motas, carros e peças que queres acompanhar com mais atenção.
          </p>
        </div>
      </div>
      {favorites.length === 0 ? (
        <div className="section-card">
          <p>Não tens produtos marcados como favoritos.</p>
        </div>
      ) : (
        <div className="grid">
          {favorites.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Favorites;
