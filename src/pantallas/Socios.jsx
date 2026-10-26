import React, { useState, useEffect, useMemo } from "react";
import { sociosService } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import FormularioSocioModal from "../components/socios/FormularioSocioModal";
import DetalleSocioModal from "../components/socios/DetalleSocioModal";
import FormularioSuscripcionModal from "../components/suscripciones/FormularioSuscripcionModal";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Power,
  Trash2,
  CreditCard,
  Phone,
  Mail,
} from "lucide-react";

const Socios = () => {
  const { usuario, isAdmin, showToast } = useAuth();
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS"); // TODOS, ACTIVOS, INACTIVOS

  // Modals state
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [socioAEditar, setSocioAEditar] = useState(null);

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);

  const [modalSubOpen, setModalSubOpen] = useState(false);
  const [socioParaSub, setSocioParaSub] = useState(null);

  const cargarSocios = async () => {
    try {
      setLoading(true);
      const data = await sociosService.listar();
      setSocios(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      showToast(err.message || "Error al cargar la lista de socios", "error");
      setSocios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSocios();
  }, []);

  const handleToggleEstado = async (socio) => {
    const nuevoEstado = !socio.activo;
    try {
      await sociosService.cambiarEstado(socio.id, nuevoEstado);
      showToast(
        `Socio ${socio.nombre} ${nuevoEstado ? "activado" : "desactivado"} correctamente`,
        "success"
      );
      cargarSocios();
    } catch (err) {
      showToast(err.message || "No se pudo cambiar el estado", "error");
    }
  };

  const handleEliminar = async (socio) => {
    if (!isAdmin) {
      showToast("Solo los administradores pueden eliminar registros", "error");
      return;
    }
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar permanentemente al socio ${socio.nombre} ${socio.apellido || ""}? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    try {
      await sociosService.eliminar(socio.id);
      showToast("Socio eliminado del sistema", "success");
      cargarSocios();
    } catch (err) {
      showToast(err.message || "Error al eliminar el socio", "error");
    }
  };

  const sociosFiltrados = useMemo(() => {
    return socios.filter((s) => {
      // Status filter
      if (filterStatus === "ACTIVOS" && !s.activo) return false;
      if (filterStatus === "INACTIVOS" && s.activo) return false;

      // Text search
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchDni = s.dni?.toLowerCase().includes(term);
      const matchNombre = s.nombre?.toLowerCase().includes(term);
      const matchApellido = s.apellido?.toLowerCase().includes(term);
      const matchCorreo = s.correo?.toLowerCase().includes(term);
      const matchTel = s.telefono?.includes(term);

      return matchDni || matchNombre || matchApellido || matchCorreo || matchTel;
    });
  }, [socios, filterStatus, searchTerm]);

  return (
    <div>
      {/* HEADER ACTIONS */}
      <div className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Users size={22} style={{ color: "var(--color-brand-primary)" }} />
              Directorio de Socios
            </h2>
            <p>
              Total registrados: <strong>{socios.length}</strong> • Activos:{" "}
              <strong>{socios.filter((s) => s.activo).length}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarSocios}
              disabled={loading}
              title="Recargar lista"
            >
              <RefreshCw size={16} className={loading ? "spinner" : ""} />
              Actualizar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSocioAEditar(null);
                setModalFormOpen(true);
              }}
            >
              <UserPlus size={16} />
              Registrar Socio
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div className="search-input-wrapper" style={{ flex: 1, maxWidth: "420px" }}>
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por DNI, nombre, apellido o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
            Estado:
          </span>
          <div style={{ display: "flex", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-light)" }}>
            {["TODOS", "ACTIVOS", "INACTIVOS"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: "6px 14px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background:
                    filterStatus === st
                      ? "var(--color-brand-primary)"
                      : "var(--bg-surface-elevated, #162032)",
                  color: filterStatus === st ? "#090d16" : "var(--text-secondary)",
                  transition: "all var(--transition-fast)",
                }}
              >
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      {loading ? (
        <LoadingSpinner text="Cargando socios..." />
      ) : sociosFiltrados.length === 0 ? (
        <EmptyState
          title="No se encontraron socios"
          description={
            searchTerm
              ? `No hay socios que coincidan con la búsqueda "${searchTerm}".`
              : "Aún no hay socios registrados en esta categoría."
          }
          actionLabel="Registrar Nuevo Socio"
          onAction={() => {
            setSocioAEditar(null);
            setModalFormOpen(true);
          }}
        />
      ) : (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Socio</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Fecha Ingreso</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sociosFiltrados.map((socio) => (
                <tr key={socio.id}>
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "var(--text-main)",
                        background: "var(--bg-surface-elevated, #162032)",
                        border: "1px solid var(--border-light)",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {socio.dni}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "14px" }}>
                      {socio.nombre} {socio.apellido || ""}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "12px" }}>
                      {socio.telefono && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                          <Phone size={12} style={{ color: "var(--color-brand-primary)" }} /> {socio.telefono}
                        </span>
                      )}
                      {socio.correo && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)" }}>
                          <Mail size={12} /> {socio.correo}
                        </span>
                      )}
                      {!socio.telefono && !socio.correo && (
                        <span style={{ color: "var(--text-disabled)" }}>Sin contacto</span>
                      )}
                    </div>
                  </td>

                  <td>
                    <Badge status={socio.activo} />
                  </td>

                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    {socio.fechaCreacion
                      ? new Date(socio.fechaCreacion).toLocaleDateString("es-PE")
                      : "—"}
                  </td>

                  <td>
                    <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                      {/* VER DETALLE */}
                      <button
                        type="button"
                        className="btn-icon"
                        title="Ver ficha completa"
                        onClick={() => {
                          setSocioSeleccionado(socio);
                          setModalDetalleOpen(true);
                        }}
                      >
                        <Eye size={16} />
                      </button>

                      {/* VENDER MEMBRESÍA */}
                      <button
                        type="button"
                        className="btn-icon"
                        title="Asignar suscripción"
                        style={{ color: "var(--color-brand-primary)" }}
                        onClick={() => {
                          setSocioParaSub(socio);
                          setModalSubOpen(true);
                        }}
                      >
                        <CreditCard size={16} />
                      </button>

                      {/* EDITAR */}
                      <button
                        type="button"
                        className="btn-icon"
                        title="Editar teléfono o correo"
                        onClick={() => {
                          setSocioAEditar(socio);
                          setModalFormOpen(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* TOGGLE ESTADO */}
                      <button
                        type="button"
                        className="btn-icon"
                        title={socio.activo ? "Desactivar socio" : "Activar socio"}
                        style={{ color: socio.activo ? "var(--color-warning)" : "var(--color-success)" }}
                        onClick={() => handleToggleEstado(socio)}
                      >
                        <Power size={16} />
                      </button>

                      {/* ELIMINAR (SOLO ADMIN) */}
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn-icon"
                          title="Eliminar socio"
                          style={{ color: "var(--color-danger)" }}
                          onClick={() => handleEliminar(socio)}
                        >
                          <Trash2 size={16} />
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

      {/* MODAL REGISTRAR / EDITAR */}
      {modalFormOpen && (
        <FormularioSocioModal
          isOpen={modalFormOpen}
          socioAEditar={socioAEditar}
          onClose={() => setModalFormOpen(false)}
          onSuccess={(socioRes) => {
            setModalFormOpen(false);
            cargarSocios();
            if (!socioAEditar && socioRes) {
              setSocioParaSub(socioRes);
              setModalSubOpen(true);
            }
          }}
        />
      )}

      {/* MODAL DETALLE DEL SOCIO */}
      {modalDetalleOpen && (
        <DetalleSocioModal
          isOpen={modalDetalleOpen}
          socio={socioSeleccionado}
          onClose={() => setModalDetalleOpen(false)}
          onEdit={(s) => {
            setSocioAEditar(s);
            setModalFormOpen(true);
          }}
          onNuevaSuscripcion={(s) => {
            setSocioParaSub(s);
            setModalSubOpen(true);
          }}
        />
      )}

      {/* MODAL NUEVA SUSCRIPCIÓN */}
      {modalSubOpen && (
        <FormularioSuscripcionModal
          isOpen={modalSubOpen}
          socioPreseleccionado={socioParaSub}
          onClose={() => setModalSubOpen(false)}
          onSuccess={() => {
            setModalSubOpen(false);
            cargarSocios();
          }}
        />
      )}
    </div>
  );
};

export default Socios;
