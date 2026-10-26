import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setOnUnauthorized, authService, sedesService, asignacionesService } from "../api/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    try {
      const stored = localStorage.getItem("yanfitness_usuario");
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem("yanfitness_usuario");
      return null;
    }
  });

  const [sedesList, setSedesList] = useState([]);
  const [sedeTurno, setSedeTurnoState] = useState(() => {
    try {
      const stored = localStorage.getItem("yanfitness_sede_turno");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [toasts, setToasts] = useState([]);

  const setSedeTurno = useCallback((sede) => {
    setSedeTurnoState(sede);
    if (sede) {
      localStorage.setItem("yanfitness_sede_turno", JSON.stringify(sede));
    } else {
      localStorage.removeItem("yanfitness_sede_turno");
    }
  }, []);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const rolNormalizado = usuario?.rol?.toUpperCase() || "";
  const isAdmin = ["ADMIN", "ADMINISTRADOR"].includes(rolNormalizado);
  const isSupervisor = rolNormalizado === "SUPERVISOR";
  const isRolGlobal = isAdmin || isSupervisor;

  // Fetch available branches and assign default shift branch only for operational roles (not Admin/Supervisor)
  useEffect(() => {
    if (usuario) {
      sedesService
        .listar(true)
        .then(async (sedes) => {
          const lista = Array.isArray(sedes) ? sedes : [];
          setSedesList(lista);

          if (isRolGlobal) {
            // Administradores y Supervisores gestionan todas las sedes sin estar atados a una sede de turno
            localStorage.removeItem("yanfitness_sede_turno");
            setSedeTurnoState(null);
            return;
          }

          if (lista.length > 0) {
            setSedeTurnoState((current) => {
              if (current && lista.some((s) => s.id === current.id)) {
                return current;
              }
              if (usuario.empleadoId) {
                asignacionesService
                  .listar({ empleadoId: usuario.empleadoId })
                  .then((asigs) => {
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                    const activa = asigs?.find(
                      (a) => !a.anulada && (!a.fechaHasta || a.fechaHasta > todayStr)
                    );
                    if (activa) {
                      const matched = lista.find((s) => s.id === activa.sedeId);
                      if (matched) {
                        setSedeTurno(matched);
                        return;
                      }
                    }
                    setSedeTurno(lista[0]);
                  })
                  .catch(() => {
                    setSedeTurno(lista[0]);
                  });
                return current || lista[0];
              }

              localStorage.setItem("yanfitness_sede_turno", JSON.stringify(lista[0]));
              return lista[0];
            });
          }
        })
        .catch(() => {});
    }
  }, [usuario, isRolGlobal, setSedeTurno]);

  const logout = useCallback(async () => {
    try {
      if (usuario?.token) {
        await authService.logout().catch(() => {});
      }
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem("yanfitness_usuario");
      localStorage.removeItem("yanfitness_token");
      localStorage.removeItem("yanfitness_sede_turno");
      setUsuario(null);
      setSedeTurnoState(null);
      showToast("Has cerrado sesión exitosamente", "info");
    }
  }, [usuario, showToast]);

  useEffect(() => {
    setOnUnauthorized(() => {
      localStorage.removeItem("yanfitness_usuario");
      localStorage.removeItem("yanfitness_token");
      localStorage.removeItem("yanfitness_sede_turno");
      setUsuario(null);
      setSedeTurnoState(null);
      showToast("Tu sesión ha expirado. Por favor ingresa de nuevo.", "error");
    });
  }, [showToast]);

  const login = (userData, persist = true) => {
    setUsuario(userData);
    if (persist) {
      localStorage.setItem("yanfitness_usuario", JSON.stringify(userData));
      localStorage.setItem("yanfitness_token", userData.token);
    } else {
      localStorage.removeItem("yanfitness_usuario");
      localStorage.setItem("yanfitness_token", userData.token);
    }
    showToast(`Bienvenido, ${userData.username}`, "success");
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAdmin,
        isSupervisor,
        isRolGlobal,
        sedeTurno,
        setSedeTurno,
        sedesList,
        login,
        logout,
        showToast,
        toasts,
        removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
