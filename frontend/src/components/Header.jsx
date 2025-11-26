import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { theme, toggleTheme } = useTheme();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const navClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

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
          {user && (
            <div className="nav-user">Olá, {user.nome}</div>
          )}
          <button
            className="nav-theme-button"
            type="button"
            onClick={toggleTheme}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
