import { useEffect, useMemo, useState } from "react";
import api from "../api";
import ProductCard from "../components/ProductCard";

function Shop() {
  const [products, setProducts] = useState([]);
  const [tipo, setTipo] = useState("todos");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("nome");
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 8;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/products");
        setProducts(res.data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFilterChange = value => {
    setTipo(value);
    setPage(1);
  };

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...products];

    if (tipo !== "todos") {
      result = result.filter(p => p.tipo === tipo);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        p =>
          p.nome.toLowerCase().includes(s) ||
          p.categoria.toLowerCase().includes(s) ||
          p.descricao.toLowerCase().includes(s)
      );
    }

    if (minPrice) {
      const min = Number(minPrice) || 0;
      result = result.filter(p => p.preco >= min);
    }

    if (maxPrice) {
      const max = Number(maxPrice) || 0;
      if (max > 0) {
        result = result.filter(p => p.preco <= max);
      }
    }

    if (inStockOnly) {
      result = result.filter(p => p.stock > 0);
    }

    result.sort((a, b) => {
      if (sortBy === "nome") {
        const valA = a.nome.toLowerCase();
        const valB = b.nome.toLowerCase();
        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      } else {
        const valA = a.preco;
        const valB = b.preco;
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
    });

    return result;
  }, [products, tipo, search, minPrice, maxPrice, inStockOnly, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  const tipoLabelMap = {
    todos: "Todos os tipos",
    mota: "Motas",
    carro: "Carros",
    peca: "Peças"
  };

  const activeFilters = [];
  if (tipo !== "todos") activeFilters.push(tipoLabelMap[tipo]);
  if (minPrice) activeFilters.push(`Mín: ${minPrice} €`);
  if (maxPrice) activeFilters.push(`Máx: ${maxPrice} €`);
  if (inStockOnly) activeFilters.push("Apenas em stock");

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Loja</h2>
          <p className="page-subtitle">
            Explora motas, carros e peças, com filtros à tua medida.
          </p>
        </div>
      </div>

      <div className="shop-layout">
        <aside className="shop-sidebar section-card">
          <div className="shop-sidebar-title">Filtros</div>

          <div className="shop-sidebar-group">
            <div className="shop-sidebar-label">Tipo de produto</div>
            <div className="chips chips-vertical">
              <button
                className={`chip ${tipo === "todos" ? "chip-active" : ""}`}
                onClick={() => handleFilterChange("todos")}
              >
                Tudo
              </button>
              <button
                className={`chip ${tipo === "mota" ? "chip-active" : ""}`}
                onClick={() => handleFilterChange("mota")}
              >
                Motas
              </button>
              <button
                className={`chip ${tipo === "carro" ? "chip-active" : ""}`}
                onClick={() => handleFilterChange("carro")}
              >
                Carros
              </button>
              <button
                className={`chip ${tipo === "peca" ? "chip-active" : ""}`}
                onClick={() => handleFilterChange("peca")}
              >
                Peças
              </button>
            </div>
          </div>

          <div className="shop-sidebar-group">
            <div className="shop-sidebar-label">Intervalo de preço</div>
            <div className="shop-price-row">
              <input
                className="input-inline"
                placeholder="Mín"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
              />
              <span className="shop-price-sep">–</span>
              <input
                className="input-inline"
                placeholder="Máx"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="shop-sidebar-group">
            <label className="shop-checkbox">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
              />
              <span>Apenas produtos em stock</span>
            </label>
          </div>

          <div className="shop-sidebar-group">
            <div className="shop-sidebar-label">Ordenação</div>
            <div className="shop-sort-row">
              <select
                className="input-inline"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="nome">Nome</option>
                <option value="preco">Preço</option>
              </select>
              <select
                className="input-inline"
                value={sortDir}
                onChange={e => setSortDir(e.target.value)}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>
        </aside>

        <section className="shop-results">
          <div className="shop-results-header section-card">
            <form className="shop-search" onSubmit={handleSearch}>
              <input
                placeholder="Pesquisar por nome, categoria ou descrição"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="button button-secondary" type="submit">
                Pesquisar
              </button>
            </form>
            <div className="shop-results-meta">
              <span className="shop-results-count">
                {filtered.length} produto
                {filtered.length === 1 ? "" : "s"} encontrado
                {filtered.length === 0 ? "" : "s"}.
              </span>
              {activeFilters.length > 0 && (
                <div className="shop-pills">
                  {activeFilters.map(f => (
                    <span key={f} className="shop-pill">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="shop-empty section-card">
              <p>A carregar produtos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="shop-empty section-card">
              <div className="shop-empty-icon">🧾</div>
              <div className="shop-empty-title">Nenhum produto encontrado</div>
              <p className="shop-empty-text">
                Ajusta os filtros ou remove o intervalo de preço para veres mais
                resultados.
              </p>
            </div>
          ) : (
            <>
              <div className="grid">
                {pageItems.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="pagination">
                <button
                  className="button button-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  Anterior
                </button>
                <span style={{ fontSize: "0.85rem" }}>
                  Página {safePage} de {totalPages}
                </span>
                <button
                  className="button button-secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  Seguinte
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Shop;
