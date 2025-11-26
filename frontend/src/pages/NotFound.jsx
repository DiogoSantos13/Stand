import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Página não encontrada</h2>
          <p className="page-subtitle">
            A rota que procuraste não existe. Talvez tenhas seguido um link antigo.
          </p>
        </div>
      </div>
      <div className="section-card">
        <p>Volta à página inicial e continua a explorar o stand.</p>
        <Link to="/">
          <button className="button button-primary" style={{ marginTop: "0.75rem" }}>
            Voltar ao início
          </button>
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
