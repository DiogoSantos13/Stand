/**
 * api.js
 *
 * O que faz:
 * - Cria uma instância do Axios já apontada ao backend.
 * - Antes de cada pedido, injeta automaticamente o token JWT (se existir).
 * - Se o backend responder 401 (token inválido/expirado), limpa o token e o user guardados.
 *
 * Vantagem:
 * - Não precisas de escrever headers Authorization em cada pedido.
 * - Evitas bugs em páginas protegidas, porque o token vai sempre junto.
 */

import axios from "axios";

/**
 * URL base da API.
 * - Se definires VITE_API_URL no .env do frontend, ele usa esse valor.
 * - Caso contrário, usa o default local.
 */
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Instância Axios principal da aplicação.
 */
const api = axios.create({
  baseURL,
  timeout: 15000
});

/**
 * Interceptor de pedidos:
 * - Corre antes de cada request sair do browser.
 * - Se existir token no localStorage, mete no header Authorization.
 */
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");

    // Garantir que config.headers existe, para não dar erro em requests “nuas”
    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

/**
 * Interceptor de respostas:
 * - Corre quando o backend responde com erro.
 * - Se for 401, normalmente significa token inválido/expirado.
 * - Faz sentido limpar token e user para obrigar a novo login.
 */
api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // Não faz sentido “deslogar” se estiveres a tentar fazer login/registo
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

export default api;
