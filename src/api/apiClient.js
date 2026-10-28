/**
 * Centralized API client for YANFITNESS backend communication.
 * Handles JWT bearer tokens, JSON serializing, and error extraction.
 */

const BASE_URL = (import.meta.env?.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

let onUnauthorizedCallback = null;

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback;
};

export const request = async (endpoint, options = {}) => {
  const token =
    localStorage.getItem("yanfitness_token") ||
    sessionStorage.getItem("yanfitness_token") ||
    (() => {
      try {
        const raw =
          localStorage.getItem("yanfitness_usuario") ||
          sessionStorage.getItem("yanfitness_usuario") ||
          "{}";
        const u = JSON.parse(raw);
        return u?.token;
      } catch {
        return null;
      }
    })();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401 && endpoint !== "/auth/login") {
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    throw new ApiError("Tu sesión ha expirado o no es válida. Inicia sesión nuevamente.", 401);
  }

  if (response.status === 204) {
    return null;
  }

  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMsg = "";
    const GENERIC_HTTP_ERRORS = new Set([
      "bad request",
      "unauthorized",
      "forbidden",
      "not found",
      "conflict",
      "internal server error",
      "unprocessable entity",
      "method not allowed",
      "no message available",
    ]);

    if (data && typeof data === "object") {
      // 1. Spring Boot MethodArgumentNotValidException / Bean Validation errors
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg = data.errors
          .map((e) => e.defaultMessage || e.message || (typeof e === "string" ? e : null))
          .filter(Boolean)
          .join(". ");
      } else if (data.errors && typeof data.errors === "object") {
        errorMsg = Object.values(data.errors)
          .filter((v) => typeof v === "string" && v.length > 0)
          .join(". ");
      } else if (data.mensaje && typeof data.mensaje === "string") {
        errorMsg = data.mensaje;
      } else if (
        data.message &&
        typeof data.message === "string" &&
        !data.message.includes("Validation failed for object") &&
        !GENERIC_HTTP_ERRORS.has(data.message.trim().toLowerCase())
      ) {
        errorMsg = data.message;
      } else if (data.detail && typeof data.detail === "string") {
        errorMsg = data.detail;
      } else if (
        data.error &&
        typeof data.error === "string" &&
        !GENERIC_HTTP_ERRORS.has(data.error.trim().toLowerCase())
      ) {
        errorMsg = data.error;
      }
    } else if (
      typeof data === "string" &&
      data.trim().length > 0 &&
      !GENERIC_HTTP_ERRORS.has(data.trim().toLowerCase())
    ) {
      errorMsg = data.trim();
    }

    if (errorMsg) {
      errorMsg = errorMsg.replace(/^regla de negocio:\s*/i, "");
      errorMsg = errorMsg.charAt(0).toUpperCase() + errorMsg.slice(1);
    }

    // Mensajes informativos en español según el contexto cuando el servidor no adjunta detalle
    if (!errorMsg) {
      if (response.status === 401) {
        errorMsg = "Verifica tu usuario y contraseña para iniciar sesión.";
      } else if (response.status === 423) {
        errorMsg = "Esta cuenta se encuentra bloqueada temporalmente por intentos fallidos.";
      } else if (response.status === 403) {
        errorMsg = "Tu rol actual no cuenta con permisos para realizar esta acción.";
      } else if (response.status === 404) {
        errorMsg = "La información solicitada no se encuentra registrada actualmente.";
      } else if (response.status === 400) {
        if (endpoint.includes("/suscripciones")) {
          errorMsg =
            "Para registrar la membresía, verifica que la sede tenga una tarifa activa asignada y que los importes sean válidos.";
        } else if (endpoint.includes("/inscripciones")) {
          errorMsg =
            "Para inscribir al socio en esta clase, verifica que cuente con una membresía vigente para esta sede (o con acceso Multisede).";
        } else if (endpoint.includes("/asistencias")) {
          errorMsg =
            "Verifica que la inscripción del socio en la clase esté activa y que la fecha seleccionada sea válida.";
        } else if (endpoint.includes("/asignaciones")) {
          errorMsg =
            "Verifica que el colaborador y la sede estén activos y que la fecha de fin no sea anterior a la fecha de inicio.";
        } else {
          errorMsg = "Por favor verifica que todos los campos del formulario estén completos y con el formato indicado.";
        }
      } else if (response.status === 409) {
        if (endpoint.includes("/suscripciones")) {
          errorMsg =
            "El número de operación ingresado ya fue utilizado en otro comprobante, o la suscripción ya se encuentra finalizada.";
        } else if (endpoint.includes("/pagos")) {
          errorMsg = "El número de operación ingresado ya se encuentra registrado en otro comprobante de caja.";
        } else if (endpoint.includes("/asignaciones")) {
          errorMsg =
            "El colaborador ya cuenta con una asignación vigente en esa sede para el periodo indicado.";
        } else if (endpoint.includes("/gimnasio")) {
          errorMsg = "Ya existe un socio registrado con ese DNI o correo, o tiene historial de membresías vinculado.";
        } else if (endpoint.includes("/empleados")) {
          errorMsg = "Ya existe un colaborador registrado con ese número de DNI o correo electrónico.";
        } else if (endpoint.includes("/clases")) {
          errorMsg = "El instructor seleccionado ya tiene otra clase programada en ese mismo día y horario.";
        } else if (endpoint.includes("/inscripciones")) {
          errorMsg = "El socio ya se encuentra inscrito en esta clase o se alcanzó el cupo máximo de participantes.";
        } else {
          errorMsg = "Esta información ya se encuentra registrada en el sistema o tiene operaciones históricas asociadas.";
        }
      } else {
        errorMsg = "Por favor verifica los datos ingresados e inténtalo nuevamente.";
      }
    }

    throw new ApiError(errorMsg, response.status, data);
  }

  return data;
};

export const api = {
  get: (endpoint, options) => request(endpoint, { method: "GET", ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: "POST", body, ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: "PUT", body, ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: "PATCH", body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: "DELETE", ...options }),
};

// ==========================================
// MODULE API SERVICES
// ==========================================

export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  registrar: (userData) => api.post("/auth/registrar", userData),
  logout: () => api.post("/auth/logout"),
  logoutTodas: () => api.post("/auth/logout-todas"),
};

export const dashboardService = {
  getDashboard: () => api.get("/dashboard"),
};

export const sociosService = {
  listar: () => api.get("/gimnasio"),
  listarPagina: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.append("q", params.q);
    if (params.page !== undefined) query.append("page", params.page);
    if (params.size !== undefined) query.append("size", params.size);
    return api.get(`/gimnasio/pagina?${query.toString()}`);
  },
  obtenerCantidad: () => api.get("/gimnasio/cantidad"),
  obtenerReporte: () => api.get("/gimnasio/reporte"),
  obtenerPorId: (id) => api.get(`/gimnasio/${id}`),
  crear: (socio) => api.post("/gimnasio", socio),
  actualizar: (id, data) => api.put(`/gimnasio/${id}`, data),
  cambiarEstado: (id, activo) => api.patch(`/gimnasio/${id}/estado`, { activo }),
  eliminar: (id) => api.delete(`/gimnasio/${id}`),
};

export const sedesService = {
  listar: (soloActivas) => {
    const qs = soloActivas ? "?soloActivas=true" : "";
    return api.get(`/sedes${qs}`);
  },
  obtenerPorId: (id) => api.get(`/sedes/${id}`),
  crear: (data) => api.post("/sedes", data),
  actualizar: (id, data) => api.put(`/sedes/${id}`, data),
  cambiarEstado: (id, activo) => api.patch(`/sedes/${id}/estado`, { activo }),
  eliminar: (id) => api.delete(`/sedes/${id}`),
};

export const planesService = {
  listar: (soloActivos) => {
    const qs = soloActivos ? "?soloActivos=true" : "";
    return api.get(`/planes${qs}`);
  },
  obtenerPorId: (id) => api.get(`/planes/${id}`),
  crear: (data) => api.post("/planes", data),
  actualizar: (id, data) => api.put(`/planes/${id}`, data),
  cambiarEstado: (id, activo) => api.patch(`/planes/${id}/estado`, { activo }),
  eliminar: (id) => api.delete(`/planes/${id}`),
  obtenerPreciosPorPlan: (id) => api.get(`/planes/${id}/precios-sede`),
  asignarPrecioSede: (id, data) => api.post(`/planes/${id}/precios-sede`, data),
  obtenerPlanesPorSede: (sedeId, soloActivos) => {
    const qs = soloActivos ? "?soloActivos=true" : "";
    return api.get(`/planes/sede/${sedeId}${qs}`);
  },
};

export const suscripcionesService = {
  listar: (params = {}) => {
    const query = new URLSearchParams();
    if (params.socioId) query.append("socioId", params.socioId);
    if (params.estado) query.append("estado", params.estado);
    return api.get(`/suscripciones?${query.toString()}`);
  },
  listarPagina: (params = {}) => {
    const query = new URLSearchParams();
    if (params.estado) query.append("estado", params.estado);
    if (params.page !== undefined) query.append("page", params.page);
    if (params.size !== undefined) query.append("size", params.size);
    return api.get(`/suscripciones/pagina?${query.toString()}`);
  },
  obtenerPorVencer: (dias = 7) => api.get(`/suscripciones/por-vencer?dias=${dias}`),
  obtenerPorId: (id) => api.get(`/suscripciones/${id}`),
  obtenerVigenteDeSocio: (socioId) => api.get(`/suscripciones/socio/${socioId}/vigente`),
  obtenerPagosDeSuscripcion: (id) => api.get(`/suscripciones/${id}/pagos`),
  crear: (data) => api.post("/suscripciones", data),
  cambiarEstado: (id, estado, motivo) => api.patch(`/suscripciones/${id}/estado`, { estado, motivo }),
};

export const pagosService = {
  listar: (sedeId) => {
    const qs = sedeId ? `?sedeId=${sedeId}` : "";
    return api.get(`/pagos${qs}`);
  },
  listarPagina: (params = {}) => {
    const query = new URLSearchParams();
    if (params.sedeId) query.append("sedeId", params.sedeId);
    if (params.page !== undefined) query.append("page", params.page);
    if (params.size !== undefined) query.append("size", params.size);
    return api.get(`/pagos/pagina?${query.toString()}`);
  },
  obtenerReporte: (params = {}) => {
    const query = new URLSearchParams();
    if (params.desde) query.append("desde", params.desde);
    if (params.hasta) query.append("hasta", params.hasta);
    if (params.sedeId) query.append("sedeId", params.sedeId);
    return api.get(`/pagos/reporte?${query.toString()}`);
  },
  obtenerPorId: (id) => api.get(`/pagos/${id}`),
  registrarPaseDiario: (data) => api.post("/pagos/pase-diario", data),
  anularPago: (id, motivo) => api.patch(`/pagos/${id}/anular`, { motivo }),
};

export const clasesService = {
  listar: (params = {}) => {
    const query = new URLSearchParams();
    if (params.sedeId) query.append("sedeId", params.sedeId);
    if (params.instructorId) query.append("instructorId", params.instructorId);
    if (params.soloActivas !== undefined) query.append("soloActivas", params.soloActivas);
    return api.get(`/clases?${query.toString()}`);
  },
  obtenerPorId: (id) => api.get(`/clases/${id}`),
  obtenerInscripciones: (claseId, soloActivas) => {
    const qs = soloActivas ? "?soloActivas=true" : "";
    return api.get(`/clases/${claseId}/inscripciones${qs}`);
  },
  crear: (data) => api.post("/clases", data),
  actualizar: (id, data) => api.put(`/clases/${id}`, data),
  cambiarEstado: (id, activo) => api.patch(`/clases/${id}/estado`, { activo }),
};

export const inscripcionesService = {
  obtenerPorSocio: (socioId, soloActivas) => {
    const qs = soloActivas ? "&soloActivas=true" : "";
    return api.get(`/inscripciones?socioId=${socioId}${qs}`);
  },
  inscribir: (socioId, claseId) => api.post("/inscripciones", { socioId, claseId }),
  darDeBaja: (id) => api.patch(`/inscripciones/${id}/baja`),
  obtenerAsistenciasDeInscripcion: (id) => api.get(`/inscripciones/${id}/asistencias`),
  registrarAsistencia: (data) => api.post("/asistencias", data),
  obtenerAsistenciasDeClase: (claseId, fecha) => {
    const qs = fecha ? `&fecha=${fecha}` : "";
    return api.get(`/asistencias?claseId=${claseId}${qs}`);
  },
};

export const empleadosService = {
  listar: (soloActivos) => {
    const qs = soloActivos !== undefined ? `?soloActivos=${soloActivos}` : "";
    return api.get(`/empleados${qs}`);
  },
  listarPagina: (params = {}) => {
    const query = new URLSearchParams();
    if (params.soloActivos !== undefined) query.append("soloActivos", params.soloActivos);
    if (params.page !== undefined) query.append("page", params.page);
    if (params.size !== undefined) query.append("size", params.size);
    return api.get(`/empleados/pagina?${query.toString()}`);
  },
  obtenerInstructores: () => api.get("/empleados/instructores"),
  obtenerPorId: (id) => api.get(`/empleados/${id}`),
  crear: (data) => api.post("/empleados", data),
  actualizar: (id, data) => api.put(`/empleados/${id}`, data),
  cambiarEstado: (id, activo) => api.patch(`/empleados/${id}/estado`, { activo }),
};

export const asignacionesService = {
  listar: (params = {}) => {
    const query = new URLSearchParams();
    if (params.empleadoId) query.append("empleadoId", params.empleadoId);
    if (params.sedeId) query.append("sedeId", params.sedeId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/asignaciones${qs}`);
  },
  obtenerPorId: (id) => api.get(`/asignaciones/${id}`),
  asignar: (data) => api.post("/asignaciones", data),
  finalizar: (id, data) => api.patch(`/asignaciones/${id}/finalizar`, data || {}),
  anular: (id) => api.patch(`/asignaciones/${id}/anular`),
};

export const usuariosAdminService = {
  listar: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.append("q", params.q);
    if (params.page !== undefined) query.append("page", params.page);
    if (params.size !== undefined) query.append("size", params.size);
    return api.get(`/usuarios?${query.toString()}`);
  },
  obtenerPorId: (id) => api.get(`/usuarios/${id}`),
  cambiarEstado: (id, activo) => api.patch(`/usuarios/${id}/estado`, { activo }),
  bloquear: (id, payload) =>
    api.patch(
      `/usuarios/${id}/bloquear`,
      typeof payload === "object" && payload !== null
        ? payload
        : { minutos: 60, motivo: payload }
    ),
  desbloquear: (id) => api.patch(`/usuarios/${id}/desbloquear`),
  resetearPassword: (id, nuevoPassword) =>
    api.patch(`/usuarios/${id}/password`, { nuevoPassword, password: nuevoPassword }),
  sesionesActivas: (id) => api.get(`/usuarios/${id}/sesiones`),
  cerrarSesiones: (id) => api.delete(`/usuarios/${id}/sesiones`),
};
