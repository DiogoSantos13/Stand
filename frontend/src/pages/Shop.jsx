/**
 * Shop.jsx
 *
 * Página da Loja:
 * - Carrega produtos do backend (Sheety via API)
 * - Filtra por tipo, preço, pesquisa e stock
 * - Ordena resultados
 * - Mostra estados de loading, erro e “sem resultados”
 * - Mantém o layout a usar as classes do teu CSS (shop-layout, grid, card, chips, etc.)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

const TIPOS = [
  { value: "todos", label: "Tudo" },
  { value: "carro", label: "Carros" },
  { value: "mota", label: "Motas" },
  { value: "pecas", label: "Peças" },
  { value: "acessorios", label: "Acessórios" }
];

const ORDER_FIELDS = [
  { value: "nome", label: "Nome" },
  { value: "preco", label: "Preço" },
  { value: "stock", label: "Stock" }
];

const ORDER_DIR = [
  { value: "asc", label: "Asc" },
  { value: "desc", label: "Desc" }
];

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={`chip ${active ? "chip-active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Shop() {
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [products, setProducts] = useState([]);

  const [tipo, setTipo] = useState("todos");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);

  const [orderField, setOrderField] = useState("nome");
  const [orderDir, setOrderDir] = useState("asc");

  const lastQueryRef = useRef("");

  function validatePriceRange() {
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    if (min !== null && Number.isNaN(min)) return "Preço mínimo inválido.";
    if (max !== null && Number.isNaN(max)) return "Preço máximo inválido.";
    if (min !== null && max !== null && min > max) return "O mínimo não pode ser maior do que o máximo.";
    return "";
  }

  function resetFilters() {
    setTipo("todos");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setOrderField("nome");
    setOrderDir("asc");
    showToast("Filtros limpos");
  }

  async function loadProducts({ silent = false } = {}) {
    const priceError = validatePriceRange();
    if (priceError) {
      setError(priceError);
      if (!silent) showToast(priceError, "error");
      return;
    }

    const signature = JSON.stringify({
      tipo,
      search: search.trim(),
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      inStock
    });

    if (signature === lastQueryRef.current && !silent) return;
    lastQueryRef.current = signature;

    setError("");
    setLoading(true);

    try {
      const res = await api.get("/products", {
        params: {
          tipo,
          search: search.trim() || undefined,
          minPrice: minPrice.trim() || undefined,
          maxPrice: maxPrice.trim() || undefined,
          inStock: inStock ? "1" : undefined
        }
      });

      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao carregar produtos.";
      setProducts([]);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts({ silent: true });
  }, []);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    const dir = orderDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      if (orderField === "preco") return (Number(a.preco) - Number(b.preco)) * dir;
      if (orderField === "stock") return (Number(a.stock) - Number(b.stock)) * dir;

      const an = String(a.nome || "").toLowerCase();
      const bn = String(b.nome || "").toLowerCase();
      if (an < bn) return -1 * dir;
      if (an > bn) return 1 * dir;
      return 0;
    });

    return list;
  }, [products, orderField, orderDir]);

  const activeTags = useMemo(() => {
    const tags = [];
    if (tipo !== "todos") tags.push(`Tipo: ${TIPOS.find(t => t.value === tipo)?.label || tipo}`);
    if (search.trim()) tags.push(`Pesquisa: "${search.trim()}"`);
    if (minPrice.trim()) tags.push(`Min: ${minPrice.trim()}€`);
    if (maxPrice.trim()) tags.push(`Max: ${maxPrice.trim()}€`);
    if (inStock) tags.push("Só em stock");
    return tags;
  }, [tipo, search, minPrice, maxPrice, inStock]);

  function handleAddToCart(product) {
    const stock = Number(product.stock) || 0;
    if (stock <= 0) {
      showToast("Produto esgotado", "error");
      return;
    }
    addToCart(product);
    showToast("Produto adicionado ao carrinho");
  }

  function handleToggleFavorite(product) {
    const wasFav = isFavorite(product.id);
    toggleFavorite(product);
    showToast(wasFav ? "Removido dos favoritos" : "Adicionado aos favoritos");
  }

  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      loadProducts();
    }
  }

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Loja</h2>
          <p className="page-subtitle">
            Explora motas, carros, peças e acessórios, com filtros à tua medida.
          </p>
        </div>
      </div>

      <div className="shop-layout">
        {/* SIDEBAR */}
        <aside className="shop-sidebar">
          <div className="section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
              <div className="shop-sidebar-title">Filtros</div>
              <button type="button" className="button button-secondary" onClick={resetFilters}>
                Limpar
              </button>
            </div>

            <div className="shop-sidebar-group" style={{ marginTop: "1rem" }}>
              <div className="shop-sidebar-label">Tipo de produto</div>
              <div className="chips chips-vertical" style={{ marginTop: "0.5rem" }}>
                {TIPOS.map(t => (
                  <FilterChip key={t.value} active={tipo === t.value} onClick={() => setTipo(t.value)}>
                    {t.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="shop-sidebar-group" style={{ marginTop: "1.25rem" }}>
              <div className="shop-sidebar-label">Intervalo de preço</div>
              <div className="shop-price-row" style={{ marginTop: "0.5rem" }}>
                <input
                  className="input-inline"
                  placeholder="Mín"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  inputMode="numeric"
                />
                <span className="shop-price-sep">–</span>
                <input
                  className="input-inline"
                  placeholder="Máx"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              {validatePriceRange() ? (
                <div style={{ marginTop: "0.5rem", color: "#b91c1c", fontSize: "0.85rem" }}>
                  {validatePriceRange()}
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label className="shop-checkbox">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={e => setInStock(e.target.checked)}
                />
                Apenas produtos em stock
              </label>
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <div className="shop-sidebar-label">Ordenação</div>
              <div className="shop-sort-row" style={{ marginTop: "0.5rem" }}>
                <select value={orderField} onChange={e => setOrderField(e.target.value)}>
                  {ORDER_FIELDS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <select value={orderDir} onChange={e => setOrderDir(e.target.value)}>
                  {ORDER_DIR.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="button button-primary"
              style={{ marginTop: "1.25rem", width: "100%" }}
              onClick={() => loadProducts()}
              disabled={loading}
            >
              {loading ? "A aplicar..." : "Aplicar filtros"}
            </button>
          </div>
        </aside>

        {/* RESULTADOS */}
        <section className="shop-results">
          <div className="shop-results-header">
            <div className="shop-search">
              <input
                placeholder="Pesquisar por nome, categoria ou descrição"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={onSearchKeyDown}
              />
              <button className="button button-secondary" onClick={() => loadProducts()} disabled={loading}>
                Pesquisar
              </button>
            </div>

            <div className="shop-results-meta">
              <div className="shop-results-count">
                {loading ? "A carregar..." : `${sortedProducts.length} produto(s) encontrados.`}
              </div>

              {activeTags.length > 0 ? (
                <div className="shop-pills">
                  {activeTags.map(t => (
                    <span key={t} className="shop-pill">{t}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="section-card">
              <div style={{ fontWeight: 700, marginBottom: "0.4rem" }}>Erro</div>
              <div className="alert alert-error" style={{ marginBottom: 0 }}>{error}</div>
              <button type="button" className="button button-secondary" style={{ marginTop: "1rem" }} onClick={() => loadProducts()}>
                Tentar novamente
              </button>
            </div>
          ) : null}

          {!loading && !error && sortedProducts.length === 0 ? (
            <div className="section-card shop-empty">
              <div className="shop-empty-icon">🧾</div>
              <div className="shop-empty-title">Nenhum produto encontrado</div>
              <div className="shop-empty-text">
                Ajusta os filtros ou remove o intervalo de preço para veres mais resultados.
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.2rem" }}>
                <button type="button" className="button button-secondary" onClick={resetFilters}>
                  Limpar filtros
                </button>
                <button type="button" className="button button-primary" onClick={() => loadProducts()}>
                  Recarregar
                </button>
              </div>
            </div>
          ) : null}

          {/* Grid */}
          <div className="grid" style={{ opacity: loading ? 0.55 : 1 }}>
            {sortedProducts.map(p => {
              const esgotado = (Number(p.stock) || 0) <= 0;
              const fav = isFavorite(p.id);

              return (
                <div key={p.id} className="card">
                  <div className="card-img-wrapper">
                    <span className="card-tag">
                      {p.tipo} · {p.categoria}
                    </span>
                    <span className="card-price-chip">
                      {Number(p.preco).toFixed(2)} €
                    </span>
                    <img
                      src={p.imagemUrl}
                      alt={p.nome}
                      onError={e => {
                        e.currentTarget.style.opacity = "0.15";
                      }}
                    />
                  </div>

                  <div className="card-body">
                    <div className="card-title">{p.nome}</div>
                    <div className="card-sub">
                      Stock: <span className="badge-small">{esgotado ? "Esgotado" : `${p.stock} unidade(s)`}</span>
                    </div>
                    <div className="card-desc">{p.descricao || "—"}</div>

                    <div className="card-footer-row">
                      <Link to={`/product/${p.id}`} className="button button-secondary">
                        Ver
                      </Link>

                      <button
                        type="button"
                        className="button button-primary"
                        disabled={esgotado}
                        onClick={() => handleAddToCart(p)}
                        title={esgotado ? "Produto esgotado" : "Adicionar ao carrinho"}
                      >
                        {esgotado ? "Esgotado" : "Adicionar"}
                      </button>

                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => handleToggleFavorite(p)}
                        title={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        {fav ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Shop;
