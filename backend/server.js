/**
 * server.js
 *
 * Backend (Express) do Stand:
 * - Autenticação (JWT)
 * - Produtos (listar/detalhe)
 * - Comentários (listar/criar)
 * - Encomendas:
 *    - cliente cria encomenda -> valida stock e baixa stock no Sheety
 *    - cliente vê as suas encomendas
 *    - admin vê todas as encomendas e altera o estado (para a frente e para trás)
 * - Admin Produtos (CRUD) com tipos limitados:
 *    "mota", "carro", "acessorios", "pecas"
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const sheety = require("./sheetyClient");

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const JWT_SECRET = process.env.JWT_SECRET || "stand-motas-carros-secret";

/**
 * Tipos permitidos para o campo "tipo" no produto.
 * (Se tiveres produtos antigos com "luvas" ou "peca", o servidor normaliza.)
 */
const ALLOWED_PRODUCT_TYPES = ["mota", "carro", "acessorios", "pecas"];

/**
 * Estados permitidos para encomendas.
 * O admin pode avançar OU recuar (ex.: voltar a pendente).
 */
const ALLOWED_ORDER_STATES = [
  "pendente",
  "processamento",
  "enviada",
  "concluida",
  "cancelada"
];

/**
 * CORS:
 * Permite qualquer localhost:517x (Vite muda a porta).
 */
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok =
        /^http:\/\/localhost:517\d$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:517\d$/.test(origin);
      if (ok) return cb(null, true);
      return cb(new Error(`CORS bloqueado para a origem: ${origin}`), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

/* =========================================================
 * Helpers: compatibilidade appId/appid e userId/userid
 * ========================================================= */

/**
 * Lê o appId de uma linha, mesmo que a sheet esteja com header "appid".
 */
function getAppId(row) {
  return row?.appId ?? row?.appid ?? null;
}

/**
 * Lê o userId de uma linha, mesmo que a sheet esteja com header "userid".
 */
function getUserId(row) {
  return row?.userId ?? row?.userid ?? null;
}

/**
 * Normaliza o "tipo" para os teus novos valores:
 * - "luvas" -> "acessorios"
 * - "peca"  -> "pecas"
 */
function normalizeTipo(tipo) {
  const t = String(tipo || "").trim().toLowerCase();
  if (t === "luvas") return "acessorios";
  if (t === "peca") return "pecas";
  return t;
}

/**
 * Procura uma linha por appId (sem filters do Sheety).
 */
async function findRowByAppId(sheet, appId) {
  const rows = await sheety.list(sheet);
  return rows.find(r => String(getAppId(r) ?? "") === String(appId)) || null;
}

/**
 * Procura o rowId interno do Sheety (coluna "id") por appId.
 */
async function findRowIdByAppId(sheet, appId) {
  const row = await findRowByAppId(sheet, appId);
  return row?.id || null;
}

/**
 * Procura a primeira linha onde field == value (sem filters).
 * Ex.: users por email.
 */
async function findFirstByField(sheet, field, value) {
  const rows = await sheety.list(sheet);
  return rows.find(r => String(r?.[field] ?? "") === String(value)) || null;
}

/* =========================================================
 * Mappers: linha Sheety -> objecto da API
 * ========================================================= */

function toUser(row) {
  if (!row) return null;
  return {
    id: getAppId(row),
    nome: row.nome,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role
  };
}

function toProduct(row) {
  if (!row) return null;
  return {
    id: getAppId(row),
    nome: row.nome,
    tipo: normalizeTipo(row.tipo),
    categoria: row.categoria,
    preco: Number(row.preco) || 0,
    stock: Number(row.stock) || 0,
    imagemUrl: row.imagemUrl || "",
    descricao: row.descricao || ""
  };
}

function toComment(row) {
  if (!row) return null;
  return {
    id: getAppId(row),
    productId: row.productId,
    userId: getUserId(row),
    authorName: row.authorName,
    message: row.message,
    createdAt: row.createdAt
  };
}

function toOrder(row) {
  if (!row) return null;

  let items = [];
  try {
    items = row.itemsJson ? JSON.parse(row.itemsJson) : [];
  } catch {
    items = [];
  }

  return {
    id: getAppId(row),
    userId: getUserId(row),
    items,
    total: Number(row.total) || 0,
    createdAt: row.createdAt,
    estado: row.estado || "pendente",
    // novos campos na sheet "orders"
    nome: row.nome || "",
    telefone: row.telefone || ""
  };
}

/* =========================================================
 * Auth: JWT + middlewares
 * ========================================================= */

/**
 * Cria token JWT para um utilizador.
 */
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Middleware: valida token e coloca utilizador em req.user.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "Token em falta" });

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userRow = await findRowByAppId("users", decoded.id);
    const user = toUser(userRow);

    if (!user || !user.id) {
      return res.status(401).json({ message: "Utilizador não encontrado" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

/**
 * Middleware: exige admin.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Acesso reservado a administradores" });
  }
  next();
}

/* =========================================================
 * AUTH routes
 * ========================================================= */

/**
 * POST /api/auth/register
 * Regista novo utilizador.
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({ message: "Campos em falta" });
    }

    const existsRow = await findFirstByField("users", "email", email);
    if (existsRow) {
      return res.status(400).json({ message: "Email já registado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // regra simples de admin (podes mudar)
    const role = email === "admin@stand.pt" ? "admin" : "cliente";

    const user = { id: uuidv4(), nome, email, passwordHash, role };

    await sheety.create("users", {
      appId: user.id,
      appid: user.id,
      nome: user.nome,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role
    });

    const token = createToken(user);

    return res.json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
    });
  } catch (err) {
    const status = err?.response?.status;
    if (status === 402) {
      return res.status(503).json({
        message: "Quota do Sheety atingida. Faz upgrade ou aguarda o reset mensal."
      });
    }
    return res.status(500).json({ message: "Erro no registo" });
  }
});

/**
 * POST /api/auth/login
 * Login com email/password.
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Campos em falta" });
    }

    const userRow = await findFirstByField("users", "email", email);
    const user = toUser(userRow);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = createToken(user);

    return res.json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
    });
  } catch {
    return res.status(500).json({ message: "Erro no login" });
  }
});

/**
 * GET /api/auth/me
 * Devolve o utilizador autenticado.
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  return res.json({
    id: req.user.id,
    nome: req.user.nome,
    email: req.user.email,
    role: req.user.role
  });
});

/* =========================================================
 * PRODUCTS
 * ========================================================= */

/**
 * GET /api/products
 * Lista produtos com filtros (em memória).
 */
app.get("/api/products", async (req, res) => {
  try {
    let result = (await sheety.list("products"))
      .map(toProduct)
      .filter(p => p && p.id);

    const { tipo, search, minPrice, maxPrice, inStock } = req.query;

    if (tipo && tipo !== "todos") {
      result = result.filter(p => p.tipo === String(tipo).toLowerCase());
    }

    if (search) {
      const s = String(search).toLowerCase();
      result = result.filter(
        p =>
          (p.nome || "").toLowerCase().includes(s) ||
          (p.categoria || "").toLowerCase().includes(s) ||
          (p.descricao || "").toLowerCase().includes(s)
      );
    }

    if (minPrice) {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) result = result.filter(p => p.preco >= min);
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) result = result.filter(p => p.preco <= max);
    }

    if (inStock === "1") {
      result = result.filter(p => p.stock > 0);
    }

    return res.json(result);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 402) {
      return res.status(503).json({
        message: "Quota do Sheety atingida. Faz upgrade ou aguarda o reset mensal."
      });
    }
    return res.status(500).json({ message: "Erro ao carregar produtos" });
  }
});

/**
 * GET /api/products/:id
 * Detalhe de produto.
 */
app.get("/api/products/:id", async (req, res) => {
  try {
    const row = await findRowByAppId("products", req.params.id);
    const product = toProduct(row);

    if (!product || !product.id) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    return res.json(product);
  } catch {
    return res.status(500).json({ message: "Erro ao carregar produto" });
  }
});

/* =========================================================
 * COMMENTS
 * ========================================================= */

/**
 * GET /api/products/:id/comments
 * Lista comentários de um produto.
 */
app.get("/api/products/:id/comments", async (req, res) => {
  try {
    const rows = await sheety.list("comments");

    const list = rows
      .filter(r => String(r.productId ?? "") === String(req.params.id))
      .map(toComment)
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(list);
  } catch {
    return res.status(500).json({ message: "Erro ao carregar comentários" });
  }
});

/**
 * POST /api/products/:id/comments
 * Cria comentário (requer login).
 */
app.post("/api/products/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Mensagem em falta" });
    }

    const productRow = await findRowByAppId("products", req.params.id);
    const product = toProduct(productRow);

    if (!product || !product.id) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const comment = {
      id: uuidv4(),
      productId: product.id,
      userId: req.user.id,
      authorName: req.user.nome,
      message: String(message).trim(),
      createdAt: new Date().toISOString()
    };

    await sheety.create("comments", {
      appId: comment.id,
      appid: comment.id,
      productId: comment.productId,
      userId: comment.userId,
      userid: comment.userId,
      authorName: comment.authorName,
      message: comment.message,
      createdAt: comment.createdAt
    });

    return res.status(201).json(comment);
  } catch {
    return res.status(500).json({ message: "Erro ao criar comentário" });
  }
});

/* =========================================================
 * ORDERS
 * ========================================================= */

/**
 * POST /api/orders
 * Cria encomenda:
 * - valida itens
 * - valida stock
 * - baixa stock no Sheety
 * - grava encomenda com estado="pendente"
 *
 * Body esperado:
 * {
 *   items: [{ productId, quantity }],
 *   nome: "Nome para a encomenda",
 *   telefone: "..."
 * }
 */
app.post("/api/orders", authMiddleware, async (req, res) => {
  try {
    const { items, nome, telefone } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Itens em falta" });
    }

    // carregar produtos e mapear por appId (como string)
    const productRows = await sheety.list("products");
    const productsById = new Map(
      productRows.map(r => [String(getAppId(r)), r])
    );

    // somar quantidades por produto
    const neededQty = new Map();
    for (const it of items) {
      const productId = String(it.productId || "");
      const quantity = Number(it.quantity) || 0;

      if (!productId) return res.status(400).json({ message: "Produto inválido" });
      if (quantity <= 0) return res.status(400).json({ message: "Quantidade inválida" });

      neededQty.set(productId, (neededQty.get(productId) || 0) + quantity);
    }

    // preparar updates de stock
    const stockUpdates = [];
    for (const [productId, qty] of neededQty.entries()) {
      const row = productsById.get(productId);
      if (!row) return res.status(400).json({ message: "Produto inválido" });

      const oldStock = Number(row.stock) || 0;
      if (oldStock < qty) {
        const p = toProduct(row);
        return res.status(409).json({
          message: `Stock insuficiente para "${p?.nome || "produto"}". Disponível: ${oldStock}`
        });
      }

      stockUpdates.push({ rowId: row.id, oldStock, newStock: oldStock - qty });
    }

    // construir items finais e total
    let total = 0;
    const orderItems = [];

    for (const it of items) {
      const row = productsById.get(String(it.productId));
      const product = toProduct(row);
      const quantity = Number(it.quantity) || 0;

      total += (product?.preco || 0) * quantity;

      orderItems.push({
        productId: product?.id,
        nome: product?.nome,
        preco: product?.preco || 0,
        quantity
      });
    }

    const order = {
      id: uuidv4(),
      userId: req.user.id,
      items: orderItems,
      total,
      createdAt: new Date().toISOString(),
      estado: "pendente",
      nome: String(nome || req.user.nome || "").trim(),
      telefone: String(telefone || "").trim()
    };

    // aplicar updates de stock e gravar encomenda (rollback simples)
    const applied = [];
    try {
      for (const u of stockUpdates) {
        await sheety.update("products", u.rowId, { stock: u.newStock });
        applied.push(u);
      }

      await sheety.create("orders", {
        appId: order.id,
        appid: order.id,
        userId: order.userId,
        userid: order.userId,
        itemsJson: JSON.stringify(order.items),
        total: order.total,
        createdAt: order.createdAt,
        estado: order.estado,
        nome: order.nome,
        telefone: order.telefone
      });
    } catch (err) {
      // repor stock se já baixámos algum
      for (const u of applied) {
        try {
          await sheety.update("products", u.rowId, { stock: u.oldStock });
        } catch {}
      }

      const msg =
        err?.response?.data?.errors?.[0]?.detail ||
        "Erro ao criar encomenda";
      return res.status(500).json({ message: msg });
    }

    return res.status(201).json(order);
  } catch {
    return res.status(500).json({ message: "Erro ao criar encomenda" });
  }
});

/**
 * GET /api/orders/my
 * Devolve as encomendas do utilizador autenticado.
 */
app.get("/api/orders/my", authMiddleware, async (req, res) => {
  try {
    const rows = await sheety.list("orders");

    const list = rows
      .filter(r => String(getUserId(r) ?? "") === String(req.user.id))
      .map(toOrder)
      .filter(o => o && o.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(list);
  } catch {
    return res.status(500).json({ message: "Erro ao carregar encomendas" });
  }
});

/**
 * GET /api/admin/orders
 * Admin vê todas as encomendas.
 * Se a encomenda antiga não tiver "nome", tenta ir buscar ao utilizador.
 */
app.get("/api/admin/orders", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [orderRows, userRows] = await Promise.all([
      sheety.list("orders"),
      sheety.list("users")
    ]);

    const users = userRows.map(toUser).filter(Boolean);
    const userNameById = new Map(users.map(u => [String(u.id), u.nome]));

    const list = orderRows
      .map(r => {
        const o = toOrder(r);
        if (!o) return null;

        if (!o.nome) {
          o.nome = userNameById.get(String(o.userId)) || "";
        }

        return o;
      })
      .filter(o => o && o.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(list);
  } catch {
    return res.status(500).json({ message: "Erro ao carregar encomendas" });
  }
});

/**
 * PUT /api/admin/orders/:id/estado
 * Admin altera o estado (pode avançar ou recuar).
 * Body: { estado: "pendente" | "processamento" | "enviada" | "concluida" | "cancelada" }
 */
app.put("/api/admin/orders/:id/estado", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const estado = String(req.body?.estado || "").trim().toLowerCase();

    if (!ALLOWED_ORDER_STATES.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const rowId = await findRowIdByAppId("orders", req.params.id);
    if (!rowId) return res.status(404).json({ message: "Encomenda não encontrada" });

    const updatedRow = await sheety.update("orders", rowId, { estado });
    return res.json(toOrder(updatedRow));
  } catch {
    return res.status(500).json({ message: "Erro ao atualizar estado" });
  }
});

/* =========================================================
 * ADMIN PRODUCTS (CRUD)
 * ========================================================= */

/**
 * GET /api/admin/products
 * Admin lista produtos.
 */
app.get("/api/admin/products", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const result = (await sheety.list("products")).map(toProduct).filter(Boolean);
    return res.json(result);
  } catch {
    return res.status(500).json({ message: "Erro ao carregar produtos" });
  }
});

/**
 * POST /api/admin/products
 * Admin cria produto (com validação de tipo).
 */
app.post("/api/admin/products", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { nome, tipo, categoria, preco, stock, imagemUrl, descricao } = req.body;

    if (!nome || !tipo || !categoria) {
      return res.status(400).json({ message: "Campos obrigatórios em falta" });
    }

    const tipoN = normalizeTipo(tipo);
    if (!ALLOWED_PRODUCT_TYPES.includes(tipoN)) {
      return res.status(400).json({
        message: `Tipo inválido. Usa apenas: ${ALLOWED_PRODUCT_TYPES.join(", ")}`
      });
    }

    const product = {
      id: uuidv4(),
      nome: String(nome).trim(),
      tipo: tipoN,
      categoria: String(categoria).trim(),
      preco: Number(preco) || 0,
      stock: Number(stock) || 0,
      imagemUrl: imagemUrl || "",
      descricao: descricao || ""
    };

    await sheety.create("products", {
      appId: product.id,
      appid: product.id,
      nome: product.nome,
      tipo: product.tipo,
      categoria: product.categoria,
      preco: product.preco,
      stock: product.stock,
      imagemUrl: product.imagemUrl,
      descricao: product.descricao
    });

    return res.status(201).json(product);
  } catch {
    return res.status(500).json({ message: "Erro ao criar produto" });
  }
});

/**
 * PUT /api/admin/products/:id
 * Admin atualiza produto (se alterar tipo, valida).
 */
app.put("/api/admin/products/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const rowId = await findRowIdByAppId("products", req.params.id);
    if (!rowId) return res.status(404).json({ message: "Produto não encontrado" });

    const { nome, tipo, categoria, preco, stock, imagemUrl, descricao } = req.body;

    const changes = {};
    if (nome !== undefined) changes.nome = String(nome).trim();
    if (categoria !== undefined) changes.categoria = String(categoria).trim();
    if (preco !== undefined) changes.preco = Number(preco);
    if (stock !== undefined) changes.stock = Number(stock);
    if (imagemUrl !== undefined) changes.imagemUrl = imagemUrl;
    if (descricao !== undefined) changes.descricao = descricao;

    if (tipo !== undefined) {
      const tipoN = normalizeTipo(tipo);
      if (!ALLOWED_PRODUCT_TYPES.includes(tipoN)) {
        return res.status(400).json({
          message: `Tipo inválido. Usa apenas: ${ALLOWED_PRODUCT_TYPES.join(", ")}`
        });
      }
      changes.tipo = tipoN;
    }

    const updatedRow = await sheety.update("products", rowId, changes);
    return res.json(toProduct(updatedRow));
  } catch {
    return res.status(500).json({ message: "Erro ao atualizar produto" });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Admin apaga produto.
 */
app.delete("/api/admin/products/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const rowId = await findRowIdByAppId("products", req.params.id);
    if (!rowId) return res.status(404).json({ message: "Produto não encontrado" });

    await sheety.remove("products", rowId);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: "Erro ao apagar produto" });
  }
});

/* =========================================================
 * Arranque
 * ========================================================= */

/**
 * Inicia o servidor.
 */
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
