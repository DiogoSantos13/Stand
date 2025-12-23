/**
 * AdminNotificationsContext.jsx
 *
 * Contexto que mantém uma “notificação” simples para o admin:
 * - Conta quantas encomendas estão com estado "pendente"
 * - Atualiza ao iniciar sessão e em intervalos (polling leve)
 * - Só funciona se o utilizador for admin
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { useAuth } from "./AuthContext";

const AdminNotificationsContext = createContext(null);

export function AdminNotificationsProvider({ children }) {
  const { user, token } = useAuth();

  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const isAdmin = user?.role === "admin";

  async function refreshPendingCount({ silent = false } = {}) {
    if (!isAdmin || !token) {
      setPendingCount(0);
      return;
    }

    if (!silent) setLoading(true);

    try {
      const res = await api.get("/admin/orders");
      const orders = Array.isArray(res.data) ? res.data : [];
      const count = orders.filter(o => String(o.estado || "").toLowerCase() === "pendente").length;
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isAdmin || !token) {
      setPendingCount(0);
      return;
    }

    refreshPendingCount({ silent: true });

    timerRef.current = setInterval(() => {
      refreshPendingCount({ silent: true });
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAdmin, token]);

  const value = useMemo(
    () => ({
      pendingCount,
      loading,
      refreshPendingCount
    }),
    [pendingCount, loading]
  );

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    return { pendingCount: 0, loading: false, refreshPendingCount: async () => {} };
  }
  return ctx;
}
