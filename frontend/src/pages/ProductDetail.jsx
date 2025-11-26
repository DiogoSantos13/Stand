import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch {
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };

    const loadComments = async () => {
      try {
        const res = await api.get(`/products/${id}/comments`);
        setComments(res.data);
      } catch {
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };

    loadProduct();
    loadComments();
  }, [id]);

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

  const handleSubmitComment = async e => {
    e.preventDefault();
    if (!user) {
      showToast("Tens de fazer login para comentar", "error");
      return;
    }
    if (!commentText.trim()) return;

    try {
      const res = await api.post(`/products/${id}/comments`, {
        message: commentText
      });
      setComments(prev => [res.data, ...prev]);
      setCommentText("");
      showToast("Comentário publicado");
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao publicar comentário";
      showToast(msg, "error");
    }
  };

  if (loadingProduct) return <main className="app-main">A carregar produto...</main>;
  if (!product) return <main className="app-main">Produto não encontrado.</main>;

  const tipoLabel =
    product.tipo === "mota"
      ? "Mota"
      : product.tipo === "carro"
      ? "Carro"
      : "Peça";

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">{product.nome}</h2>
          <p className="page-subtitle">
            {tipoLabel} · {product.categoria}
          </p>
        </div>
      </div>

      <div className="section-split" style={{ marginBottom: "2rem" }}>
        <div className="section-card">
          <img
            src={product.imagemUrl}
            alt={product.nome}
            style={{
              width: "100%",
              maxHeight: 430,
              objectFit: "cover",
              borderRadius: "1rem"
            }}
          />
        </div>
        <div className="section-card">
          <p style={{ marginTop: 0 }}>{product.descricao}</p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
            Stock:{" "}
            <span className="badge-small">
              {product.stock > 0 ? `${product.stock} unidade(s)` : "Indisponível"}
            </span>
          </p>
          <h3 style={{ marginTop: "1.5rem", fontSize: "1.4rem" }}>
            {product.preco.toFixed(2)} €
          </h3>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button className="button button-primary" onClick={handleAdd}>
              Adicionar ao carrinho
            </button>
            <button className="button button-secondary" onClick={handleFavorite}>
              {isFavorite(product.id)
                ? "Remover dos favoritos"
                : "Adicionar aos favoritos"}
            </button>
          </div>
        </div>
      </div>

      <section className="home-section">
        <div className="home-section-header">
          <div>
            <div className="home-section-title">Comentários</div>
            <div className="home-section-subtitle">
              Partilha a tua opinião sobre este produto.
            </div>
          </div>
        </div>
        <div className="section-card" style={{ maxWidth: 700 }}>
          {user ? (
            <form
              onSubmit={handleSubmitComment}
              style={{ marginBottom: "1rem" }}
            >
              <div className="form-group">
                <label>Deixa o teu comentário</label>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="O que achaste deste produto?"
                />
              </div>
              <button className="button button-primary" type="submit">
                Publicar
              </button>
            </form>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              Faz login para deixar um comentário.
            </p>
          )}

          {loadingComments ? (
            <p>A carregar comentários...</p>
          ) : comments.length === 0 ? (
            <p>Este produto ainda não tem comentários.</p>
          ) : (
            <div style={{ marginTop: "0.75rem" }}>
              {comments.map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: "0.6rem 0",
                    borderBottom: "1px solid var(--border)"
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{c.authorName}</div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginBottom: "0.1rem"
                    }}
                  >
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.9rem" }}>{c.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default ProductDetail;
