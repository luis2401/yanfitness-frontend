import React, { useState, useEffect } from "react";
import { usuariosAdminService, authService } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Search,
  KeyRound,
  Lock,
  Unlock,
  Power,
  Clock,
  Laptop,
} from "lucide-react";

const Usuarios = () => {
  const { usuario: currentUser, showToast } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create User Modal
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [errorCreate, setErrorCreate] = useState("");
  const [formCreate, setFormCreate] = useState({
    username: "",
    password: "",
    rol: "ADMINISTRADOR",
  });

  // Reset Password Modal
  const [modalPassOpen, setModalPassOpen] = useState(false);
  const [userParaPass, setUserParaPass] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  // Block Modal
  const [modalBloqueoOpen, setModalBloqueoOpen] = useState(false);
  const [userParaBloqueo, setUserParaBloqueo] = useState(null);
  const [motivoBloqueo, setMotivoBloqueo] = useState("");
  const [minutosBloqueo, setMinutosBloqueo] = useState(60);
  const [savingBloqueo, setSavingBloqueo] = useState(false);

  // Active Sessions Modal
  const [modalSesionesOpen, setModalSesionesOpen] = useState(false);
  const [userParaSesiones, setUserParaSesiones] = useState(null);
  const [sesionesActivas, setSesionesActivas] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [closingSesiones, setClosingSesiones] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const res = await usuariosAdminService.listar({ q: searchTerm || undefined });
      const lista = Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res?.contenido)
        ? res.contenido
        : Array.isArray(res)
        ? res
        : [];
      setUsuarios(lista);
    } catch (err) {
      showToast(err.message || "Error al cargar usuarios", "error");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [searchTerm]);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setErrorCreate("");

    if (!formCreate.username.trim() || formCreate.username.trim().length < 3) {
      setErrorCreate("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (!formCreate.password || formCreate.password.length < 6) {
      setErrorCreate("La contraseña de acceso debe tener al menos 6 caracteres.");
      return;
    }

    setSavingUser(true);
    try {
      await authService.registrar({
        username: formCreate.username.trim(),
        password: formCreate.password,
        rol: formCreate.rol,
      });
      showToast("Usuario creado exitosamente", "success");
      setModalCreateOpen(false);
      setFormCreate({ username: "", password: "", rol: "ADMINISTRADOR" });
      cargarUsuarios();
    } catch (err) {
      setErrorCreate(err.message || "No se pudo registrar el usuario.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!userParaPass || nuevaPassword.length < 6) return;
    setSavingPass(true);
    try {
      await usuariosAdminService.resetearPassword(userParaPass.id, nuevaPassword);
      showToast("Contraseña restablecida exitosamente", "success");
      setModalPassOpen(false);
      setNuevaPassword("");
    } catch (err) {
      showToast(err.message || "Error al cambiar contraseña", "error");
    } finally {
      setSavingPass(false);
    }
  };

  const handleToggleEstado = async (u) => {
    try {
      await usuariosAdminService.cambiarEstado(u.id, !u.activo);
      showToast(`Usuario ${!u.activo ? "activado" : "desactivado"}`, "success");
      cargarUsuarios();
    } catch (err) {
      showToast(err.message || "No se pudo cambiar estado", "error");
    }
  };

  const handleBloquear = async (e) => {
    e.preventDefault();
    if (!userParaBloqueo) return;
    setSavingBloqueo(true);
    try {
      await usuariosAdminService.bloquear(userParaBloqueo.id, {
        motivo: motivoBloqueo.trim() || "Bloqueo preventivo por administrador",
        minutos: Number(minutosBloqueo),
      });
      showToast("Usuario bloqueado preventivamente", "success");
      setModalBloqueoOpen(false);
      cargarUsuarios();
    } catch (err) {
      showToast(err.message || "Error al bloquear usuario", "error");
    } finally {
      setSavingBloqueo(false);
    }
  };

  const handleDesbloquear = async (u) => {
    try {
      await usuariosAdminService.desbloquear(u.id);
      showToast("Usuario desbloqueado", "success");
      cargarUsuarios();
    } catch (err) {
      showToast(err.message || "Error al desbloquear", "error");
    }
  };

  const handleVerSesiones = async (u) => {
    setUserParaSesiones(u);
    setModalSesionesOpen(true);
    setLoadingSesiones(true);
    try {
      const lista = await usuariosAdminService.sesionesActivas(u.id);
      setSesionesActivas(Array.isArray(lista) ? lista : []);
    } catch (err) {
      showToast(err.message || "No se pudieron obtener las sesiones activas", "error");
      setSesionesActivas([]);
    } finally {
      setLoadingSesiones(false);
    }
  };

  const handleCerrarTodasSesiones = async () => {
    if (!userParaSesiones) return;
    setClosingSesiones(true);
    try {
      await usuariosAdminService.cerrarSesiones(userParaSesiones.id);
      showToast(`Sesiones activas de ${userParaSesiones.username} revocadas`, "success");
      setSesionesActivas([]);
    } catch (err) {
      showToast(err.message || "No se pudieron cerrar las sesiones", "error");
    } finally {
      setClosingSesiones(false);
    }
  };

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheck size={22} style={{ color: "var(--color-brand-primary)" }} />
              Gestión de Usuarios y Seguridad
            </h2>
            <p>Control de credenciales, roles, bloqueo y sesiones de acceso al sistema</p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarUsuarios}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spinner" : ""} />
              Actualizar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setErrorCreate("");
                setModalCreateOpen(true);
              }}
            >
              <UserPlus size={16} />
              Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div className="search-input-wrapper" style={{ maxWidth: "400px" }}>
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre de usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* USERS TABLE */}
      {loading ? (
        <LoadingSpinner text="Cargando usuarios..." />
      ) : !Array.isArray(usuarios) || usuarios.length === 0 ? (
        <EmptyState
          title="No hay usuarios registrados"
          description="Crea cuentas de acceso para el personal administrativo."
          actionLabel="Registrar Usuario"
          onAction={() => setModalCreateOpen(true)}
        />
      ) : (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol de Acceso</th>
                <th>Empleado Vinculado</th>
                <th>Estado</th>
                <th>Seguridad</th>
                <th>Último Acceso</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "14px" }}>
                      {u.username}
                      {u.username === currentUser?.username && (
                        <span style={{ fontSize: "11px", color: "var(--color-brand-primary)", marginLeft: "6px" }}>
                          (Tú)
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        background: u.rolCodigo === "ADMIN" ? "var(--color-brand-light)" : "var(--bg-surface-elevated, #162032)",
                        border: "1px solid var(--border-light)",
                        color: u.rolCodigo === "ADMIN" ? "var(--color-brand-primary)" : "var(--text-secondary)",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {u.rolCodigo || "EMPLEADO"}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: "13px" }}>
                      {u.empleadoNombre || "Sin asignar"}
                    </span>
                  </td>

                  <td>
                    <Badge status={u.activo} />
                  </td>

                  <td>
                    {u.bloqueado ? (
                      <span className="badge badge-danger">
                        Bloqueado ({u.intentosFallidos || 0} fallos)
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Normal ({u.intentosFallidos || 0} fallos)
                      </span>
                    )}
                  </td>

                  <td>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {u.ultimoAcceso
                        ? new Date(u.ultimoAcceso).toLocaleString("es-PE")
                        : "Nunca"}
                    </div>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                      {/* ACTIVE SESSIONS */}
                      <button
                        type="button"
                        className="btn-icon"
                        title="Ver y gestionar sesiones activas"
                        style={{ color: "var(--color-accent)" }}
                        onClick={() => handleVerSesiones(u)}
                      >
                        <Laptop size={15} />
                      </button>

                      {/* RESET PASSWORD */}
                      <button
                        type="button"
                        className="btn-icon"
                        title="Restablecer contraseña"
                        onClick={() => {
                          setUserParaPass(u);
                          setNuevaPassword("");
                          setModalPassOpen(true);
                        }}
                      >
                        <KeyRound size={15} />
                      </button>

                      {/* BLOCK / UNBLOCK */}
                      {u.bloqueado ? (
                        <button
                          type="button"
                          className="btn-icon"
                          title="Desbloquear usuario"
                          style={{ color: "var(--color-success)" }}
                          onClick={() => handleDesbloquear(u)}
                        >
                          <Unlock size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-icon"
                          title="Bloquear preventivamente"
                          style={{ color: "var(--color-warning)" }}
                          onClick={() => {
                            setUserParaBloqueo(u);
                            setMotivoBloqueo("");
                            setMinutosBloqueo(60);
                            setModalBloqueoOpen(true);
                          }}
                        >
                          <Lock size={15} />
                        </button>
                      )}

                      {/* TOGGLE ESTADO */}
                      {u.username !== currentUser?.username && (
                        <button
                          type="button"
                          className="btn-icon"
                          title={u.activo ? "Desactivar" : "Activar"}
                          style={{ color: u.activo ? "var(--color-warning)" : "var(--color-success)" }}
                          onClick={() => handleToggleEstado(u)}
                        >
                          <Power size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {modalCreateOpen && (
        <Modal
          isOpen={modalCreateOpen}
          onClose={() => setModalCreateOpen(false)}
          title="Registrar Nuevo Usuario del Sistema"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalCreateOpen(false)}
                disabled={savingUser}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCrearUsuario}
                disabled={savingUser}
              >
                {savingUser ? "Registrando..." : "Crear Usuario"}
              </button>
            </>
          }
        >
          <form onSubmit={handleCrearUsuario}>
            {errorCreate && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "var(--color-danger-bg)",
                  color: "var(--color-danger-text)",
                  border: "1px solid var(--color-danger-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {errorCreate}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nombre de Usuario (Login) *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. carlos.admin"
                value={formCreate.username}
                onChange={(e) => setFormCreate({ ...formCreate, username: e.target.value })}
                minLength={3}
                maxLength={50}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña de Acceso *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={formCreate.password}
                onChange={(e) => setFormCreate({ ...formCreate, password: e.target.value })}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rol del Sistema (Roles en Base de Datos) *</label>
              <select
                className="form-control"
                value={formCreate.rol}
                onChange={(e) => setFormCreate({ ...formCreate, rol: e.target.value })}
                required
              >
                <option value="ADMINISTRADOR">ADMINISTRADOR - Acceso total y configuración</option>
                <option value="SUPERVISOR">SUPERVISOR - Monitoreo de operaciones y sedes</option>
                <option value="INSTRUCTOR">INSTRUCTOR - Clases grupales y asistencias</option>
                <option value="RECEPCIONISTA">RECEPCIONISTA - Socios, membresías y cobro de caja</option>
                <option value="EMPLEADO">EMPLEADO - Colaborador de gimnasio</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* RESET PASSWORD MODAL */}
      {modalPassOpen && userParaPass && (
        <Modal
          isOpen={modalPassOpen}
          onClose={() => setModalPassOpen(false)}
          title={`Restablecer Contraseña: ${userParaPass.username}`}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalPassOpen(false)}
                disabled={savingPass}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetPassword}
                disabled={savingPass || nuevaPassword.length < 6}
              >
                {savingPass ? "Guardando..." : "Actualizar Contraseña"}
              </button>
            </>
          }
        >
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">Nueva Contraseña *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </form>
        </Modal>
      )}

      {/* BLOCK MODAL */}
      {modalBloqueoOpen && userParaBloqueo && (
        <Modal
          isOpen={modalBloqueoOpen}
          onClose={() => setModalBloqueoOpen(false)}
          title={`Bloquear Acceso: ${userParaBloqueo.username}`}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalBloqueoOpen(false)}
                disabled={savingBloqueo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleBloquear}
                disabled={savingBloqueo}
              >
                {savingBloqueo ? "Bloqueando..." : "Confirmar Bloqueo"}
              </button>
            </>
          }
        >
          <form onSubmit={handleBloquear}>
            <div className="form-group">
              <label className="form-label">Duración del Bloqueo (Minutos) *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={minutosBloqueo}
                onChange={(e) => setMinutosBloqueo(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo de Bloqueo</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Incumplimiento de políticas / Suspensión de cargo"
                value={motivoBloqueo}
                onChange={(e) => setMotivoBloqueo(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ACTIVE SESSIONS MODAL */}
      {modalSesionesOpen && userParaSesiones && (
        <Modal
          isOpen={modalSesionesOpen}
          onClose={() => setModalSesionesOpen(false)}
          title={`Sesiones Activas: ${userParaSesiones.username}`}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCerrarTodasSesiones}
                disabled={closingSesiones || sesionesActivas.length === 0}
              >
                {closingSesiones ? "Cerrando..." : "Revocar Todas las Sesiones"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalSesionesOpen(false)}
              >
                Cerrar
              </button>
            </div>
          }
        >
          {loadingSesiones ? (
            <LoadingSpinner text="Consultando sesiones..." />
          ) : sesionesActivas.length === 0 ? (
            <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: 0 }}>
              Este usuario no tiene sesiones activas en este momento.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sesionesActivas.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "var(--bg-surface-elevated, #162032)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    fontSize: "12.5px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--text-main)" }}>
                      <Laptop size={14} style={{ color: "var(--color-brand-primary)" }} />
                      Sesión #{s.id}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", marginTop: "4px" }}>
                      <Clock size={12} />
                      Iniciada: {s.fechaCreacion ? new Date(s.fechaCreacion).toLocaleString("es-PE") : "Reciente"}
                    </div>
                    {s.fechaExpiracion && (
                      <div style={{ color: "var(--text-muted)", marginTop: "2px", fontSize: "11.5px" }}>
                        Expira: {new Date(s.fechaExpiracion).toLocaleString("es-PE")}
                      </div>
                    )}
                  </div>
                  <Badge variant="success">Activa</Badge>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Usuarios;
