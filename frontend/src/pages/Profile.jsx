import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, refreshMe } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        await refreshMe();
        const res = await api.get("/orders/my");
        setOrders(res.data);
      } catch {
        setOrders([]);
      }
    };
    load();
  }, [refreshMe]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const totalItems = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    return { totalOrders, totalSpent, totalItems };
  }, [orders]);

  if (!user) return <main className="app-main">Não autenticado.</main>;

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Perfil</h2>
          <p className="page-subtitle">
            Informação da tua conta e um resumo da tua atividade no stand.
          </p>
        </div>
      </div>
      <div className="section-card" style={{ maxWidth: 520 }}>
        <p>
          <strong>Nome:</strong> {user.nome}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Tipo de conta:</strong>{" "}
          <span className="badge-small">
            {user.role === "admin" ? "Administrador" : "Cliente"}
          </span>
        </p>
        <hr style={{ margin: "1rem 0" }} />
        <p>
          <strong>Encomendas realizadas:</strong> {stats.totalOrders}
        </p>
        <p>
          <strong>Itens comprados:</strong> {stats.totalItems}
        </p>
        <p>
          <strong>Total gasto:</strong> {stats.totalSpent.toFixed(2)} €
        </p>
      </div>
    </main>
  );
}

export default Profile;
