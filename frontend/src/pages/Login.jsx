import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    if (!email || !password) {
      setError("Preenche todos os campos.");
      return false;
    }
    if (!email.includes("@")) {
      setError("Email inválido.");
      return false;
    }
    if (password.length < 4) {
      setError("Password demasiado curta.");
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    try {
      await login(email, password);
      showToast("Bem-vindo de volta");
      navigate("/shop");
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao autenticar.";
      setError(msg);
      showToast(msg, "error");
    }
  };

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Entrar na conta</h2>
          <p className="page-subtitle">
            Acede ao carrinho, às tuas encomendas e ao teu perfil de cliente.
          </p>
        </div>
      </div>
      <div className="form">
        <h3>Autenticação</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </div>
          <div className="form-group">
            <label>Palavra-passe</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
            />
          </div>
          <button className="button button-primary" type="submit">
            Entrar
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Ainda não tens conta? <Link to="/register">Regista-te aqui</Link>.
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
          Para a área de administração, regista com o email{" "}
          <strong>admin@stand.pt</strong>.
        </p>
      </div>
    </main>
  );
}

export default Login;
