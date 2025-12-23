import { Link, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api";

function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { theme, toggleTheme } = useTheme();

  const safeItems = Array.isArray(items) ? items : [];

  const count = useMemo(() => {
    return safeItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  }, [safeItems]);

  const navClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  const [pendingCount, setPendingCount] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let intervalId = null;

    async function fetchPending() {
      if (!user || user.role !== "admin") {
        if (active) setPendingCount(0);
        return;
      }

      try {
        if (active) setPendingLoading(true);

        const res = await api.get("/admin/orders");
        const orders = Array.isArray(res.data) ? res.data : [];

        const c = orders.filter(
          o => String(o.estado || "").toLowerCase() === "pendente"
        ).length;

        if (active) setPendingCount(c);
      } catch {
        if (active) setPendingCount(0);
      } finally {
        if (active) setPendingLoading(false);
      }
    }

    fetchPending();

    if (user && user.role === "admin") {
      intervalId = setInterval(() => {
        fetchPending();
      }, 30000);
    }

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  return (
    <header>
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <div className="header-logo-mark">SM</div>
          <div>
            <div className="header-logo-text-main">Stand Motas & Carros</div>
            <div className="header-logo-text-sub">Motas · Carros · Peças</div>
          </div>
        </Link>

        <nav>
          <NavLink to="/" end className={navClass}>
            Início
          </NavLink>

          <NavLink to="/shop" className={navClass}>
            Loja
          </NavLink>

          <NavLink to="/favorites" className={navClass}>
            Favoritos
          </NavLink>

          {user && (
            <NavLink to="/my-orders" className={navClass}>
              Encomendas
              {user.role === "admin" ? (
                <span
                  style={{
                    marginLeft: "0.45rem",
                    padding: "0.12rem 0.5rem",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    background: pendingCount > 0 ? "var(--primary)" : "rgba(148,163,184,0.25)",
                    color: pendingCount > 0 ? "var(--primary-text)" : "var(--header-text)",
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                    opacity: pendingLoading ? 0.8 : 1
                  }}
                  title={
                    pendingLoading
                      ? "A carregar encomendas pendentes..."
                      : `${pendingCount} encomenda(s) pendente(s)`
                  }
                >
                  {pendingLoading ? "…" : pendingCount}
                </span>
              ) : null}
            </NavLink>
          )}

          {user && (
            <NavLink to="/profile" className={navClass}>
              Perfil
            </NavLink>
          )}

          <NavLink to="/cart" className={navClass}>
            Carrinho ({count})
          </NavLink>

          {user && user.role === "admin" && (
            <NavLink to="/admin/products" className={navClass}>
              Admin
            </NavLink>
          )}

          {!user && (
            <>
              <NavLink to="/login" className={navClass}>
                Entrar
              </NavLink>
              <NavLink to="/register" className={navClass}>
                Criar conta
              </NavLink>
            </>
          )}

          {user && (
            <button
              className="button button-secondary nav-cta"
              type="button"
              onClick={logout}
            >
              Sair
            </button>
          )}

          {user && <div className="nav-user">Olá, {user.nome}</div>}

          <button
            className="nav-theme-button"
            type="button"
            onClick={toggleTheme}
            title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
