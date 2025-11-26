import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const { items, total, removeFromCart, updateQuantity } = useCart();

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Carrinho</h2>
          <p className="page-subtitle">
            Revê os produtos que escolheste antes de avançar para o checkout.
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="section-card">
          <p>O teu carrinho está vazio.</p>
          <Link to="/shop">
            <button className="button button-primary" style={{ marginTop: "0.75rem" }}>
              Ir para a loja
            </button>
          </Link>
        </div>
      ) : (
        <div className="section-card">
          <div>
            {items.map(i => (
              <div
                key={i.product.id}
                style={{
                  padding: "0.75rem 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  borderBottom: "1px solid var(--border)"
                }}
              >
                <img
                  src={i.product.imagemUrl}
                  alt={i.product.nome}
                  style={{
                    width: 90,
                    height: 65,
                    objectFit: "cover",
                    borderRadius: "0.5rem"
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{i.product.nome}</div>
                  <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                    {i.product.preco.toFixed(2)} € unidade
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  value={i.quantity}
                  onChange={e => updateQuantity(i.product.id, e.target.value)}
                  style={{ width: 60 }}
                />
                <div style={{ width: 90, textAlign: "right", fontWeight: 600 }}>
                  {(i.product.preco * i.quantity).toFixed(2)} €
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => removeFromCart(i.product.id)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Total: {total.toFixed(2)} €
            </div>
            <Link to="/checkout">
              <button className="button button-primary" style={{ marginTop: "0.75rem" }}>
                Finalizar compra
              </button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default Cart;
