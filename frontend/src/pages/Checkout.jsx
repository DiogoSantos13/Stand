import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [morada, setMorada] = useState("");
  const [nif, setNif] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    if (!morada) {
      setError("Indica a morada de entrega.");
      return false;
    }
    if (nif && nif.length !== 9) {
      setError("NIF deve ter 9 dígitos.");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (items.length === 0) return;
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const payload = {
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity }))
      };
      const res = await api.post("/orders", payload);
      setSuccess(res.data);
      clearCart();
      showToast("Compra concluída com sucesso");
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao finalizar compra.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="app-main">
        <div className="page-header">
          <div>
            <h2 className="page-title">Compra concluída</h2>
            <p className="page-subtitle">
              A tua encomenda foi registada com sucesso.
            </p>
          </div>
        </div>
        <div className="section-card">
          <p>Obrigado pela tua compra.</p>
          <p>
            Número de encomenda: <strong>{success.id}</strong>
          </p>
          <p>Total pago: {success.total.toFixed(2)} €</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Checkout</h2>
          <p className="page-subtitle">
            Confirma os detalhes da encomenda e introduz os dados de faturação.
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="section-card">
          <p>O carrinho está vazio.</p>
        </div>
      ) : (
        <div className="section-split">
          <div className="section-card">
            <h3>Resumo da encomenda</h3>
            <ul style={{ paddingLeft: "1.1rem", fontSize: "0.9rem" }}>
              {items.map(i => (
                <li key={i.product.id}>
                  {i.quantity} x {i.product.nome} (
                  {(i.product.preco * i.quantity).toFixed(2)} €)
                </li>
              ))}
            </ul>
            <p style={{ marginTop: "0.75rem", fontWeight: 700 }}>
              Total: {total.toFixed(2)} €
            </p>
          </div>
          <div className="section-card">
            <h3>Dados de faturação</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Morada</label>
              <input value={morada} onChange={e => setMorada(e.target.value)} />
            </div>
            <div className="form-group">
              <label>NIF (opcional)</label>
              <input value={nif} onChange={e => setNif(e.target.value)} />
            </div>
            <button
              className="button button-primary"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "A processar..." : "Confirmar compra"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Checkout;
