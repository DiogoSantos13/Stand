import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useFavorites } from "../context/FavoritesContext";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleAdd = () => {
    addToCart(product);
    showToast("Produto adicionado ao carrinho");
  };

  const handleFavorite = () => {
    const wasFavorite = isFavorite(product.id);
    toggleFavorite(product);
    showToast(
      wasFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos"
    );
  };

  const tipoLabel =
    product.tipo === "mota"
      ? "Mota"
      : product.tipo === "carro"
      ? "Carro"
      : "Peça";

  return (
    <div className="card">
      <Link to={`/product/${product.id}`} className="card-img-wrapper">
        <img src={product.imagemUrl} alt={product.nome} />
        <div className="card-tag">
          {tipoLabel} · {product.categoria}
        </div>
        <div className="card-price-chip">
          {product.preco.toFixed(2)} €
        </div>
      </Link>
      <div className="card-body">
        <div className="card-title">
          <Link to={`/product/${product.id}`}>{product.nome}</Link>
        </div>
        <div className="card-desc">
          {product.descricao}
        </div>
        <div className="card-footer-row">
          <button className="button button-primary" onClick={handleAdd}>
            Adicionar ao carrinho
          </button>
          <button className="button button-secondary" onClick={handleFavorite}>
            {isFavorite(product.id) ? "★ Favorito" : "☆ Favorito"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
