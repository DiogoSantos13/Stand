/**
 * MyOrders.jsx
 *
 * Página de encomendas:
 * - Cliente: vê apenas as suas encomendas
 * - Admin: vê todas as encomendas e pode alterar o estado (concluir, voltar a pendente, etc.)
 * - IMPORTANTE: usa o "api" (axios) para ir sempre com token no Authorization
 */

import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ESTADOS = ["pendente", "processamento", "enviada", "concluida", "cancelada"];

function MyOrders() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdmin = user?.role === "admin";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState("");

  const title = isAdmin ? "Encomendas" : "Minhas encomendas";
  const subtitle = isAdmin
    ? "Consulta e gere as encomendas dos clientes."
    : "Consulta o histórico de compras que realizaste.";

  const totalCount = useMemo(() => orders.length, [orders]);

  async function loadOrders() {
    setLoading(true);
    try {
      const url = isAdmin ? "/admin/orders" : "/orders/my";
      const res = await api.get(url);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setOrders([]);
      const msg = err.response?.data?.message || "Erro ao carregar encomendas";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateEstado(orderId, estado) {
    if (!isAdmin) return;

    setUpdatingId(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/estado`, { estado });
      showToast("Estado atualizado");
      await loadOrders();
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao atualizar estado";
      showToast(msg, "error");
    } finally {
      setUpdatingId("");
    }
  }

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user?.id, user?.role]);

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <p>A carregar...</p>
        ) : totalCount === 0 ? (
          <p>Ainda não existem encomendas.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {orders.map(o => (
              <div key={o.id} className="order-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      Encomenda #{o.id}
                    </div>

                    <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.2rem" }}>
                      {new Date(o.createdAt).toLocaleString()}
                      {isAdmin ? (
                        <>
                          {" · "}Cliente:{" "}
                          <span style={{ fontWeight: 600 }}>
                            {o.nome || "—"}
                          </span>
                          {o.telefone ? ` · Tel: ${o.telefone}` : ""}
                        </>
                      ) : null}
                    </div>

                    <div style={{ marginTop: "0.35rem" }}>
                      Estado: <b>{o.estado}</b>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ fontWeight: 800, minWidth: 90, textAlign: "right" }}>
                      {Number(o.total).toFixed(2)} €
                    </div>

                    <button
                      className="button button-secondary"
                      onClick={() => setSelected(o)}
                    >
                      Ver detalhes
                    </button>

                    {isAdmin ? (
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <select
                          value={o.estado}
                          onChange={e => updateEstado(o.id, e.target.value)}
                          disabled={updatingId === o.id}
                          style={{ padding: "0.45rem", borderRadius: "0.7rem" }}
                        >
                          {ESTADOS.map(es => (
                            <option key={es} value={es}>
                              {es}
                            </option>
                          ))}
                        </select>

                        <button
                          className="button button-primary"
                          onClick={() => updateEstado(o.id, "concluida")}
                          disabled={updatingId === o.id}
                        >
                          Concluir
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <h3 style={{ margin: 0 }}>Detalhes da encomenda</h3>
              <button className="button button-secondary" onClick={() => setSelected(null)}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <div><b>ID:</b> {selected.id}</div>
              <div><b>Data:</b> {new Date(selected.createdAt).toLocaleString()}</div>
              <div><b>Estado:</b> {selected.estado}</div>

              {isAdmin ? (
                <>
                  <div><b>Nome:</b> {selected.nome || "—"}</div>
                  <div><b>Telefone:</b> {selected.telefone || "—"}</div>
                </>
              ) : null}

              <div style={{ marginTop: "1rem", fontWeight: 700 }}>Itens</div>
              <ul>
                {(selected.items || []).map((it, idx) => (
                  <li key={`${it.productId}-${idx}`}>
                    {it.quantity} x {it.nome} ({Number(it.preco).toFixed(2)} €)
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: "1rem", fontWeight: 800 }}>
                Total: {Number(selected.total).toFixed(2)} €
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default MyOrders;
