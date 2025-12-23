/**
 * AdminProducts.jsx
 *
 * Backoffice de produtos:
 * - Lista produtos
 * - Cria/edita/apaga
 * - Limita "tipo" a: mota, carro, acessorios, pecas
 */

import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";

const TIPOS = ["mota", "carro", "acessorios", "pecas"];

function AdminProducts() {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nome: "",
    tipo: "mota",
    categoria: "",
    preco: "",
    stock: "",
    imagemUrl: "",
    descricao: ""
  });

  const hasProducts = useMemo(() => products.length > 0, [products]);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.get("/admin/products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao carregar produtos";
      showToast(msg, "error");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.nome.trim() || !form.categoria.trim()) {
      showToast("Preenche nome e categoria", "error");
      return;
    }

    try {
      await api.post("/admin/products", {
        ...form,
        preco: Number(form.preco) || 0,
        stock: Number(form.stock) || 0
      });
      showToast("Produto criado");
      setForm({
        nome: "",
        tipo: "mota",
        categoria: "",
        preco: "",
        stock: "",
        imagemUrl: "",
        descricao: ""
      });
      loadProducts();
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao criar produto";
      showToast(msg, "error");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Tens a certeza que queres apagar este produto?")) return;

    try {
      await api.delete(`/admin/products/${id}`);
      showToast("Produto apagado");
      loadProducts();
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao apagar produto";
      showToast(msg, "error");
    }
  }

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Backoffice</h2>
          <p className="page-subtitle">Gestão de produtos.</p>
        </div>
      </div>

      <div className="section-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>Adicionar produto</h3>

        <form onSubmit={handleCreate} className="form-grid">
          <div className="form-group">
            <label>Nome</label>
            <input name="nome" value={form.nome} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange}>
              {TIPOS.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <input name="categoria" value={form.categoria} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Preço</label>
            <input name="preco" value={form.preco} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Stock</label>
            <input name="stock" value={form.stock} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Imagem URL</label>
            <input name="imagemUrl" value={form.imagemUrl} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Descrição</label>
            <input name="descricao" value={form.descricao} onChange={handleChange} />
          </div>

          <button className="button button-primary" type="submit">
            Criar
          </button>
        </form>
      </div>

      <div className="section-card">
        <h3 style={{ marginTop: 0 }}>Produtos</h3>

        {loading ? (
          <p>A carregar...</p>
        ) : !hasProducts ? (
          <p>Não existem produtos.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {products.map(p => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem",
                  border: "1px solid var(--border)",
                  borderRadius: "1rem"
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{p.nome}</div>
                  <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                    {p.tipo} · {p.categoria} · Stock: {p.stock}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <div style={{ fontWeight: 800 }}>{Number(p.preco).toFixed(2)} €</div>
                  <button className="button button-secondary" onClick={() => handleDelete(p.id)}>
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminProducts;
