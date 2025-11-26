const jwt = require("jsonwebtoken");

const secret = "segredo_super_secreto";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token em falta" });
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Token inválido" });
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Acesso reservado a administradores" });
  }
  next();
}

module.exports = { authMiddleware, requireAdmin, secret };
