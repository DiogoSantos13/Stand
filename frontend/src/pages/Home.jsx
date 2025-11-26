import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";

function Home() {
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/products");
        setFeatured(res.data.slice(0, 3));
      } catch {
        setFeatured([]);
      } finally {
        setLoadingFeatured(false);
      }
    };
    load();
  }, []);

  return (
    <main className="app-main">
      <section className="hero">
        <div className="hero-left">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Stand online de motas, carros e peças
          </div>
          <h1 className="hero-title">
            O teu próximo <span>projecto</span> de duas ou quatro rodas começa aqui.
          </h1>
          <p className="hero-subtitle">
            Motas desportivas, carros familiares e uma seleção de peças para
            preparares a tua máquina como quiseres. Compra online, com apoio
            especializado e acompanhamento em todo o processo.
          </p>
          <div className="hero-actions">
            <Link to="/shop">
              <button className="button button-primary">
                Ver viaturas e peças
              </button>
            </Link>
            <Link to="/register">
              <button className="button button-secondary">
                Criar conta cliente
              </button>
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">+200</span>
              <span>Produtos entre motas, carros e peças</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">100%</span>
              <span>Processo online, simples e transparente</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">7/7</span>
              <span>Acesso ao stand onde quiseres, quando quiseres</span>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-image-wrapper">
            <img
              src="https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Stand de automóveis"
            />
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <div>
            <div className="home-section-title">Porquê escolher o nosso stand?</div>
            <div className="home-section-subtitle">
              Mais do que vender, acompanhamos todo o ciclo: compra, preparação e
              personalização.
            </div>
          </div>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-card-title">Seleção curada</div>
            <div className="feature-card-text">
              Motas, carros e peças escolhidos para quem gosta verdadeiramente de máquinas.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-card-title">Preparação para corrida ou estrada</div>
            <div className="feature-card-text">
              Apoio na escolha de peças e configurações, seja para uso diário ou preparação
              mais extrema.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-card-title">Compra online sem complicações</div>
            <div className="feature-card-text">
              Cria conta, adiciona ao carrinho, finaliza a compra e acompanha as tuas
              encomendas.
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <div>
            <div className="home-section-title">Destaques do stand</div>
            <div className="home-section-subtitle">
              Uma amostra das viaturas e peças que podes encontrar na loja online.
            </div>
          </div>
          <Link to="/shop">
            <button className="button button-secondary">Ver loja completa</button>
          </Link>
        </div>
        {loadingFeatured ? (
          <p>A carregar destaques...</p>
        ) : featured.length === 0 ? (
          <p>Nenhum produto disponível de momento.</p>
        ) : (
          <div className="home-highlight-grid">
            {featured.map(p => {
              const tipoLabel =
                p.tipo === "mota"
                  ? "Mota"
                  : p.tipo === "carro"
                  ? "Carro"
                  : "Peça";
              return (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="home-highlight-card"
                >
                  <div className="home-highlight-image-wrapper">
                    <img src={p.imagemUrl} alt={p.nome} />
                    <div className="home-highlight-tag">
                      {tipoLabel} · {p.categoria}
                    </div>
                    <div className="home-highlight-price">
                      {p.preco.toFixed(2)} €
                    </div>
                  </div>
                  <div className="home-highlight-body">
                    <div className="home-highlight-title">{p.nome}</div>
                    <div className="home-highlight-text">{p.descricao}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <div>
            <div className="home-section-title">Como funciona na prática</div>
            <div className="home-section-subtitle">
              Em poucos passos consegues escolher, encomendar e acompanhar a tua nova máquina.
            </div>
          </div>
        </div>
        <div className="home-steps">
          <div className="home-step">
            <div className="home-step-number">1</div>
            <div className="home-step-title">Explora a loja</div>
            <div className="home-step-text">
              Usa filtros por tipo, preço e stock para encontrares motas, carros e peças.
            </div>
          </div>
          <div className="home-step">
            <div className="home-step-number">2</div>
            <div className="home-step-title">Adiciona ao carrinho</div>
            <div className="home-step-text">
              Cria conta cliente, guarda favoritos e adiciona tudo o que precisas ao carrinho.
            </div>
          </div>
          <div className="home-step">
            <div className="home-step-number">3</div>
            <div className="home-step-title">Finaliza a compra</div>
            <div className="home-step-text">
              Conclui o checkout, acompanha as encomendas e prepara as tuas máquinas.
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-cta-strip section-card">
          <div>
            <div className="home-cta-title">
              Pronto para ver o stand em modo online?
            </div>
            <div className="home-cta-text">
              Cria a tua conta, explora a loja e começa já a preparar o próximo projecto.
            </div>
          </div>
          <div className="home-cta-actions">
            <Link to="/shop">
              <button className="button button-primary">Entrar na loja</button>
            </Link>
            <Link to="/register">
              <button className="button button-secondary">Criar conta</button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
