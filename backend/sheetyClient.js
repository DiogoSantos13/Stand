/**
 * sheetyClient.js
 *
 * Cliente simples para falar com a API do Sheety.
 * - Faz GET/POST/PUT/DELETE
 * - Corrige o formato do payload (Sheety exige { product: {...} } e NÃO { products: {...} })
 * - Devolve arrays/objectos já “desembrulhados”
 */

const axios = require("axios");

const BASE_URL = process.env.SHEETY_BASE_URL;
const AUTH = process.env.SHEETY_AUTH;

if (!BASE_URL) {
  throw new Error("Falta SHEETY_BASE_URL no .env");
}

const http = axios.create({
  baseURL: BASE_URL,
  headers: AUTH ? { Authorization: AUTH } : {}
});

/**
 * Mapa para o Sheety: endpoint é plural (/products),
 * mas o body tem de ser singular ({ product: {...} }).
 */
const SHEETY_KEYS = {
  products: { plural: "products", singular: "product" },
  users: { plural: "users", singular: "user" },
  orders: { plural: "orders", singular: "order" },
  comments: { plural: "comments", singular: "comment" }
};

/**
 * Vai buscar as chaves plural/singular para uma sheet.
 */
function keysFor(sheet) {
  const k = SHEETY_KEYS[sheet];
  if (!k) {
    // fallback simples: plural = sheet, singular = remove "s" no fim
    return { plural: sheet, singular: sheet.replace(/s$/, "") };
  }
  return k;
}

/**
 * Handler comum para erros, para ficares com logs legíveis.
 */
function logSheetyError(err, method, url) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  console.error(`❌ [Sheety] ${method} ${url} -> ${status}`);
  if (data) console.error(data);
}

/**
 * Lista todos os registos de uma sheet.
 * @param {string} sheet ex.: "products"
 * @returns {Promise<Array>}
 */
async function list(sheet) {
  const { plural } = keysFor(sheet);
  const url = `/${plural}`;

  try {
    const res = await http.get(url);
    return res.data?.[plural] || [];
  } catch (err) {
    logSheetyError(err, "GET", url);
    throw err;
  }
}

/**
 * Cria um registo numa sheet.
 * @param {string} sheet ex.: "products"
 * @param {object} record campos a gravar
 * @returns {Promise<object>}
 */
async function create(sheet, record) {
  const { plural, singular } = keysFor(sheet);
  const url = `/${plural}`;

  try {
    const res = await http.post(url, { [singular]: record });
    return res.data?.[singular] || null;
  } catch (err) {
    logSheetyError(err, "POST", url);
    throw err;
  }
}

/**
 * Atualiza um registo pelo ID interno do Sheety (coluna "id").
 * @param {string} sheet ex.: "products"
 * @param {number} rowId id interno do Sheety
 * @param {object} changes campos a atualizar
 * @returns {Promise<object>}
 */
async function update(sheet, rowId, changes) {
  const { plural, singular } = keysFor(sheet);
  const url = `/${plural}/${rowId}`;

  try {
    const res = await http.put(url, { [singular]: changes });
    return res.data?.[singular] || null;
  } catch (err) {
    logSheetyError(err, "PUT", url);
    throw err;
  }
}

/**
 * Remove um registo pelo ID interno do Sheety.
 * @param {string} sheet
 * @param {number} rowId
 * @returns {Promise<void>}
 */
async function remove(sheet, rowId) {
  const { plural } = keysFor(sheet);
  const url = `/${plural}/${rowId}`;

  try {
    await http.delete(url);
  } catch (err) {
    logSheetyError(err, "DELETE", url);
    throw err;
  }
}

module.exports = { list, create, update, remove };
