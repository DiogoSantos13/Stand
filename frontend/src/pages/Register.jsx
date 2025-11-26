import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    if (!nome || !email || !password) {
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
      await register(nome, email, password);
      showToast("Conta criada com sucesso");
      navigate("/shop");
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao registar.";
      setError(msg);
      showToast(msg, "error");
    }
  };

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Criar conta</h2>
          <p className="page-subtitle">
            Regista-te para guardar favoritos, fazer encomendas e acompanhar o teu histórico.
          </p>
        </div>
      </div>
      <div className="form">
        <h3>Dados de registo</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} />
          </div>
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
            Registar
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Já tens conta? <Link to="/login">Entra aqui</Link>.
        </p>
      </div>
    </main>
  );
}

export default Register;
