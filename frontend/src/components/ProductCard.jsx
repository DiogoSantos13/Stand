/**
 * ProductCard.jsx
 *
 * Esta componente representa um “cartão” de produto na grelha da loja.
 * Serve para:
 *  - mostrar imagem, nome, tipo, categoria, preço e stock
 *  - permitir abrir os detalhes do produto
 *  - adicionar ao carrinho (apenas se houver stock)
 *  - adicionar/remover dos favoritos
 *
 * Regras importantes:
 *  - Se o stock for 0, o produto fica marcado como "Esgotado"
 *  - Se estiver esgotado, o botão de adicionar ao carrinho fica desativado
 */

import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useToast } from "../context/ToastContext";

function ProductCard({ product }) {
  /** Acesso ao carrinho (adicionar) */
  const { addToCart } = useCart();

  /** Acesso aos favoritos (verificar e alternar) */
  const { isFavorite, toggleFavorite } = useFavorites();

  /** Acesso aos toasts (mensagens rápidas) */
  const { showToast } = useToast();

  /**
   * Normaliza o tipo para evitar inconsistências vindas da sheet
   * (ex.: "Motas" vs "mota" vs "motas").
   */
  const normalizarTipo = value => {
    if (!value) return "";
    const v = String(value).trim().toLowerCase();

    if (v === "motas") return "mota";
    if (v === "carros") return "carro";
    if (v === "peças" || v === "pecas") return "peca";

    return v;
  };

  /**
   * Converte o tipo para um rótulo bonito para mostrar na UI.
   */
  const labelTipo = tipoValue => {
    const key = normalizarTipo(tipoValue);

    if (key === "mota") return "Mota";
    if (key === "carro") return "Carro";
    if (key === "peca") return "Peça";

    // Para tipos novos/criados na sheet, mostramos algo humano
    const base = String(tipoValue || "").trim();
    if (!base) return "Produto";
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  /**
   * Calcula o stock e determina se o produto está esgotado.
   */
  const stock = Number(product?.stock ?? 0);
  const estaEsgotado = stock <= 0;

  /**
   * Formata o preço sem rebentar caso venha algo estranho.
   */
  const preco = Number(product?.preco ?? 0);
  const precoFormatado = `${preco.toFixed(2)} €`;

  /**
   * Cria uma descrição curta para a grelha (para não ocupar demasiado espaço).
   */
  const descricaoCurta = (() => {
    const txt = String(product?.descricao || "").trim();
    if (!txt) return "Sem descrição.";
    return txt.length > 95 ? `${txt.slice(0, 95)}...` : txt;
  })();

  /**
   * Handler: adicionar ao carrinho.
   * - Se estiver esgotado, bloqueia e avisa.
   */
  const handleAddToCart = () => {
    if (!product?.id) return;

    if (estaEsgotado) {
      showToast("Este produto está esgotado.", "error");
      return;
    }

    addToCart(product);
    showToast("Produto adicionado ao carrinho");
  };

  /**
   * Handler: alternar favorito.
   * - Se já era favorito -> remove
   * - Se não era -> adiciona
   */
  const handleToggleFavorite = () => {
    if (!product?.id) return;

    const jaEraFavorito = isFavorite(product.id);
    toggleFavorite(product);

    showToast(jaEraFavorito ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };

  /**
   * Segurança: se o produto não vier bem, não renderizamos nada.
   */
  if (!product) return null;

  const tipoLabel = labelTipo(product.tipo);
  const categoria = product.categoria ? String(product.categoria) : "Sem categoria";
  const imagemUrl =
    product.imagemUrl ||
    "https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=1200";

  const favorito = product?.id ? isFavorite(product.id) : false;

  return (
    <div className="card">
      {/* Zona clicável para abrir detalhes (imagem) */}
      <Link to={`/product/${product.id}`} className="card-img-wrapper">
        <img src={imagemUrl} alt={product.nome} />

        {/* Tag principal (tipo + categoria) */}
        <div className="card-tag">
          {tipoLabel} · {categoria}
        </div>

        {/* Chip do preço */}
        <div className="card-price-chip">{precoFormatado}</div>

        {/* Se não houver stock, mostramos “Esgotado” por cima */}
        {estaEsgotado && (
          <div
            style={{
              position: "absolute",
              right: "0.8rem",
              top: "0.7rem",
              padding: "0.25rem 0.75rem",
              borderRadius: 999,
              fontSize: "0.7rem",
              fontWeight: 700,
              background: "rgba(220, 38, 38, 0.92)",
              color: "#fff",
              boxShadow: "0 10px 22px rgba(0,0,0,0.35)"
            }}
          >
            Esgotado
          </div>
        )}
      </Link>

      <div className="card-body">
        {/* Título (também clicável) */}
        <Link to={`/product/${product.id}`}>
          <div className="card-title">{product.nome}</div>
        </Link>

        {/* Subtexto com stock */}
        <div className="card-sub">
          Stock:{" "}
          <span className="badge-small">
            {estaEsgotado ? "Indisponível" : `${stock} unidade(s)`}
          </span>
        </div>

        {/* Descrição curta */}
        <div className="card-desc">{descricaoCurta}</div>

        {/* Ações (carrinho + favoritos) */}
        <div className="card-footer-row">
          <button
            className={`button ${estaEsgotado ? "button-secondary" : "button-primary"}`}
            onClick={handleAddToCart}
            disabled={estaEsgotado}
            type="button"
            style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }}
          >
            {estaEsgotado ? "Esgotado" : "Adicionar ao carrinho"}
          </button>

          <button
            className="button button-secondary"
            onClick={handleToggleFavorite}
            type="button"
            style={{ padding: "0.55rem 0.9rem", fontSize: "0.85rem" }}
            aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            title={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {favorito ? "★" : "☆"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
