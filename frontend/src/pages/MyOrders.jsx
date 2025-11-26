import { useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/orders/my");
        setOrders(res.data);
      } catch {
        showToast("Erro a carregar encomendas", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const toggle = id => {
    setExpanded(prev => (prev === id ? null : id));
  };

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Minhas encomendas</h2>
          <p className="page-subtitle">
            Consulta o histórico de compras que realizaste no stand.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="section-card">
          <p>A carregar encomendas...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="section-card">
          <p>Ainda não tens encomendas.</p>
        </div>
      ) : (
        <div>
          {orders.map(o => (
            <div
              key={o.id}
              className="section-card"
              style={{ marginBottom: "0.75rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>Encomenda #{o.id}</div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ fontWeight: 700 }}>
                    {o.total.toFixed(2)} €
                  </span>
                  <button
                    className="button button-secondary"
                    style={{ marginLeft: "0.75rem" }}
                    onClick={() => toggle(o.id)}
                  >
                    {expanded === o.id ? "Esconder" : "Ver detalhes"}
                  </button>
                </div>
              </div>
              {expanded === o.id && (
                <div style={{ marginTop: "0.75rem" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Qtd</th>
                        <th>Preço unidade</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.items.map(it => (
                        <tr key={it.productId}>
                          <td>{it.nome}</td>
                          <td>{it.quantity}</td>
                          <td>{it.preco.toFixed(2)} €</td>
                          <td>{(it.preco * it.quantity).toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyOrders;
