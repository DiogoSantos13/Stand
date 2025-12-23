/**
 * Checkout.jsx
 *
 * Página de checkout:
 * - Mostra resumo do carrinho
 * - Permite introduzir Nome e Telefone (guardados na sheet "orders")
 * - Envia encomenda para o backend
 * - CORREÇÃO: evita crash quando o carrinho vem undefined/corrompido
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function Checkout() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  // Defesa: se por algum motivo o contexto estiver null
  const cart = useCart() || {};
  const items = Array.isArray(cart.items) ? cart.items : [];
  const total = Number(cart.total) || 0;
  const clearCart = cart.clearCart || (() => {});

  const [nome, setNome] = useState(user?.nome || "");
  const [telefone, setTelefone] = useState("");
  const [morada, setMorada] = useState("");
  const [nif, setNif] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const payloadItems = useMemo(() => {
    return items.map(i => ({
      productId: i.product.id,
      quantity: i.quantity
    }));
  }, [items]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      showToast("O carrinho está vazio", "error");
      return;
    }

    if (!String(nome).trim()) {
      setError("Indica o teu nome para a encomenda.");
      return;
    }

    if (!String(telefone).trim()) {
      setError("Indica um número de telefone.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/orders", {
        items: payloadItems,
        nome: String(nome).trim(),
        telefone: String(telefone).trim(),
        // morada/nif ficam aqui para futuro (se criares colunas na sheet, podes gravar também)
        morada: String(morada || "").trim(),
        nif: String(nif || "").trim()
      });

      clearCart();
      showToast("Encomenda criada com sucesso");
      navigate("/orders");
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao criar encomenda";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
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

      <div className="section-split">
        <div className="section-card">
          <h3 style={{ marginTop: 0 }}>Resumo da encomenda</h3>

          {items.length === 0 ? (
            <p>O carrinho está vazio.</p>
          ) : (
            <>
              <ul>
                {items.map(i => (
                  <li key={i.product.id}>
                    {i.quantity} x {i.product.nome} ({i.product.preco.toFixed(2)} €)
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "1rem", fontWeight: 700 }}>
                Total: {total.toFixed(2)} €
              </div>
            </>
          )}
        </div>

        <div className="section-card">
          <h3 style={{ marginTop: 0 }}>Dados de faturação</h3>

          {error ? (
            <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex.: Diogo Santos"
              />
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="Ex.: 912345678"
              />
            </div>

            <div className="form-group">
              <label>Morada</label>
              <input
                value={morada}
                onChange={e => setMorada(e.target.value)}
                placeholder="Ex.: Rua ..."
              />
            </div>

            <div className="form-group">
              <label>NIF (opcional)</label>
              <input
                value={nif}
                onChange={e => setNif(e.target.value)}
                placeholder="Ex.: 123456789"
              />
            </div>

            <button
              className="button button-primary"
              type="submit"
              disabled={submitting || items.length === 0}
            >
              {submitting ? "A confirmar..." : "Confirmar compra"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default Checkout;
