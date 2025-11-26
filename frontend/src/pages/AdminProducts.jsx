import { useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";

const emptyForm = {
  id: "",
  nome: "",
  tipo: "mota",
  categoria: "",
  preco: "",
  stock: "",
  imagemUrl: "",
  descricao: ""
};

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/products");
      setProducts(res.data);
    } catch {
      showToast("Erro a carregar produtos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEdit = p => {
    setForm({
      id: p.id,
      nome: p.nome,
      tipo: p.tipo,
      categoria: p.categoria,
      preco: String(p.preco),
      stock: String(p.stock),
      imagemUrl: p.imagemUrl,
      descricao: p.descricao
    });
  };

  const handleDelete = async id => {
    if (!window.confirm("Eliminar este produto?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      showToast("Produto eliminado");
      load();
    } catch {
      showToast("Erro ao eliminar produto", "error");
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.put(`/admin/products/${form.id}`, {
          nome: form.nome,
          tipo: form.tipo,
          categoria: form.categoria,
          preco: Number(form.preco),
          stock: Number(form.stock),
          imagemUrl: form.imagemUrl,
          descricao: form.descricao
        });
        showToast("Produto atualizado");
      } else {
        await api.post("/admin/products", {
          nome: form.nome,
          tipo: form.tipo,
          categoria: form.categoria,
          preco: Number(form.preco),
          stock: Number(form.stock),
          imagemUrl: form.imagemUrl,
          descricao: form.descricao
        });
        showToast("Produto criado");
      }
      setForm(emptyForm);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao guardar produto";
      showToast(msg, "error");
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
  };

  return (
    <main className="app-main">
      <div className="page-header">
        <div>
          <h2 className="page-title">Administração de produtos</h2>
          <p className="page-subtitle">
            Gestão de motas, carros e peças disponíveis na loja online.
          </p>
        </div>
      </div>
      <div className="section-split">
        <div className="section-card">
          <h3>Lista de produtos</h3>
          {loading ? (
            <p>A carregar...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td>{p.tipo}</td>
                    <td>{p.categoria}</td>
                    <td>{p.preco.toFixed(2)} €</td>
                    <td>{p.stock}</td>
                    <td>
                      <button
                        className="button button-secondary"
                        onClick={() => handleEdit(p)}
                      >
                        Editar
                      </button>
                      <button
                        className="button button-secondary"
                        style={{ marginLeft: "0.25rem" }}
                        onClick={() => handleDelete(p.id)}
                      >
                        Apagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="section-card">
          <h3>{form.id ? "Editar produto" : "Novo produto"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
              >
                <option value="mota">Mota</option>
                <option value="carro">Carro</option>
                <option value="peca">Peça</option>
              </select>
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <input
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Preço</label>
              <input
                name="preco"
                type="number"
                step="0.01"
                value={form.preco}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>URL da imagem</label>
              <input
                name="imagemUrl"
                value={form.imagemUrl}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <input
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
              />
            </div>
            <button className="button button-primary" type="submit">
              Guardar
            </button>
            {form.id && (
              <button
                className="button button-secondary"
                style={{ marginLeft: "0.5rem" }}
                type="button"
                onClick={cancelEdit}
              >
                Cancelar
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

export default AdminProducts;
