const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 4000;
const JWT_SECRET = "stand-motas-carros-secret";

app.use(cors());
app.use(express.json());

const users = [];
const products = [
  {
    id: uuidv4(),
    nome: "BMW M3",
    tipo: "carro",
    categoria: "desportivo",
    preco: 60000,
    stock: 2,
    imagemUrl:
      "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=1200",
    descricao: "Carro desportivo de luxo."
  },
  {
    id: uuidv4(),
    nome: "Honda CBR 600",
    tipo: "mota",
    categoria: "desportiva",
    preco: 9000,
    stock: 4,
    imagemUrl:
      "https://images.pexels.com/photos/1448387/pexels-photo-1448387.jpeg?auto=compress&cs=tinysrgb&w=1200",
    descricao: "Equilíbrio entre cidade e pista."
  },
  {
    id: uuidv4(),
    nome: "Pastilhas de travão Brembo",
    tipo: "peca",
    categoria: "travagem",
    preco: 80,
    stock: 15,
    imagemUrl:
      "https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=1200",
    descricao: "Pastilhas de alto desempenho."
  },
  {
    id: uuidv4(),
    nome: "Pneu Moto 120/70 ZR17",
    tipo: "peca",
    categoria: "pneu",
    preco: 150,
    stock: 10,
    imagemUrl:
      "https://images.pexels.com/photos/210095/pexels-photo-210095.jpeg?auto=compress&cs=tinysrgb&w=1200",
    descricao: "Pneu desportivo para mota."
  }
];
const orders = [];
const comments = [];

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token em falta" });
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token)
    return res.status(401).json({ message: "Formato de token inválido" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: "Utilizador não encontrado" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Acesso reservado a administradores" });
  }
  next();
}

app.post("/api/auth/register", async (req, res) => {
  const { nome, email, password } = req.body;
  if (!nome || !email || !password) {
    return res.status(400).json({ message: "Campos em falta" });
  }
  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ message: "Email já registado" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const role = email === "admin@stand.pt" ? "admin" : "cliente";
  const user = {
    id: uuidv4(),
    nome,
    email,
    passwordHash,
    role
  };
  users.push(user);
  const token = createToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Campos em falta" });
  }
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }
  const token = createToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    }
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    nome: req.user.nome,
    email: req.user.email,
    role: req.user.role
  });
});

app.get("/api/products", (req, res) => {
  let result = [...products];
  const { tipo, search, minPrice, maxPrice, inStock } = req.query;

  if (tipo && tipo !== "todos") {
    result = result.filter(p => p.tipo === tipo);
  }

  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      p =>
        p.nome.toLowerCase().includes(s) ||
        p.categoria.toLowerCase().includes(s) ||
        p.descricao.toLowerCase().includes(s)
    );
  }

  if (minPrice) {
    const min = Number(minPrice);
    result = result.filter(p => p.preco >= min);
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    result = result.filter(p => p.preco <= max);
  }

  if (inStock === "1") {
    result = result.filter(p => p.stock > 0);
  }

  res.json(result);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Produto não encontrado" });
  res.json(product);
});

app.get("/api/products/:id/comments", (req, res) => {
  const list = comments
    .filter(c => c.productId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.post("/api/products/:id/comments", authMiddleware, (req, res) => {
  const { message } = req.body;
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Produto não encontrado" });
  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Mensagem em falta" });
  }
  const comment = {
    id: uuidv4(),
    productId: product.id,
    userId: req.user.id,
    authorName: req.user.nome,
    message: message.trim(),
    createdAt: new Date().toISOString()
  };
  comments.push(comment);
  res.status(201).json(comment);
});

app.post("/api/orders", authMiddleware, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Itens em falta" });
  }
  let total = 0;
  const orderItems = [];

  for (const it of items) {
    const product = products.find(p => p.id === it.productId);
    if (!product) {
      return res.status(400).json({ message: "Produto inválido" });
    }
    const quantity = Number(it.quantity) || 0;
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantidade inválida" });
    }
    const lineTotal = product.preco * quantity;
    total += lineTotal;
    orderItems.push({
      productId: product.id,
      nome: product.nome,
      preco: product.preco,
      quantity
    });
  }

  const order = {
    id: uuidv4(),
    userId: req.user.id,
    items: orderItems,
    total,
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  res.status(201).json(order);
});

app.get("/api/orders/my", authMiddleware, (req, res) => {
  const list = orders
    .filter(o => o.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.get("/api/admin/products", authMiddleware, requireAdmin, (req, res) => {
  res.json(products);
});

app.post("/api/admin/products", authMiddleware, requireAdmin, (req, res) => {
  const { nome, tipo, categoria, preco, stock, imagemUrl, descricao } = req.body;
  if (!nome || !tipo || !categoria) {
    return res.status(400).json({ message: "Campos obrigatórios em falta" });
  }
  const product = {
    id: uuidv4(),
    nome,
    tipo,
    categoria,
    preco: Number(preco) || 0,
    stock: Number(stock) || 0,
    imagemUrl: imagemUrl || "",
    descricao: descricao || ""
  };
  products.push(product);
  res.status(201).json(product);
});

app.put("/api/admin/products/:id", authMiddleware, requireAdmin, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Produto não encontrado" });

  const { nome, tipo, categoria, preco, stock, imagemUrl, descricao } = req.body;

  product.nome = nome ?? product.nome;
  product.tipo = tipo ?? product.tipo;
  product.categoria = categoria ?? product.categoria;
  product.preco = preco !== undefined ? Number(preco) : product.preco;
  product.stock = stock !== undefined ? Number(stock) : product.stock;
  product.imagemUrl = imagemUrl ?? product.imagemUrl;
  product.descricao = descricao ?? product.descricao;

  res.json(product);
});

app.delete("/api/admin/products/:id", authMiddleware, requireAdmin, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Produto não encontrado" });
  const removed = products.splice(index, 1)[0];
  res.json(removed);
});

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
