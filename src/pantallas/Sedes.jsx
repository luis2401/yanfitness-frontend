import React, { useState, useEffect } from "react";
import { sedesService } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import { Building2, Plus, Edit2, Power, Trash2, MapPin, Hash, RefreshCw } from "lucide-react";

const Sedes = () => {
  const { isAdmin, showToast } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [sedeAEditar, setSedeAEditar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    direccion: "",
    activa: true,
  });

  const cargarSedes = async () => {
    try {
      setLoading(true);
      const data = await sedesService.listar(false);
      setSedes(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      showToast(err.message || "Error al cargar sedes", "error");
      setSedes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSedes();
  }, []);

  const handleOpenModal = (sede = null) => {
    setSedeAEditar(sede);
    if (sede) {
      setForm({
        codigo: sede.codigo || "",
        nombre: sede.nombre || "",
        direccion: sede.direccion || "",
        activa: sede.activa,
      });
    } else {
      setForm({
        codigo: "",
        nombre: "",
        direccion: "",
        activa: true,
      });
    }
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.codigo.trim()) {
      setErrorMsg("El código de la sede es obligatorio (ej. SEDE-01).");
      return;
    }
    if (!form.nombre.trim()) {
      setErrorMsg("El nombre de la sede es obligatorio.");
      return;
    }
    if (!form.direccion.trim()) {
      setErrorMsg("La dirección de la sede es obligatoria.");
      return;
    }

    setSaving(true);
    try {
      if (sedeAEditar) {
        await sedesService.actualizar(sedeAEditar.id, {
          codigo: form.codigo,
          nombre: form.nombre,
          direccion: form.direccion,
          activa: form.activa,
        });
        showToast("Sede actualizada correctamente", "success");
      } else {
        await sedesService.crear({
          codigo: form.codigo,
          nombre: form.nombre,
          direccion: form.direccion,
          activa: form.activa,
        });
        showToast("Sede creada exitosamente", "success");
      }
      setModalOpen(false);
      cargarSedes();
    } catch (err) {
      setErrorMsg(err.message || "Error al guardar la sede.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (sede) => {
    try {
      await sedesService.cambiarEstado(sede.id, !sede.activa);
      showToast(`Sede ${!sede.activa ? "activada" : "desactivada"}`, "success");
      cargarSedes();
    } catch (err) {
      showToast(err.message || "Error al cambiar estado", "error");
    }
  };

  const handleEliminar = async (sede) => {
    const ok = window.confirm(`¿Estás seguro de eliminar la sede "${sede.nombre}"?`);
    if (!ok) return;
    try {
      await sedesService.eliminar(sede.id);
      showToast("Sede eliminada del sistema", "success");
      cargarSedes();
    } catch (err) {
      showToast(err.message || "No se pudo eliminar la sede", "error");
    }
  };

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Building2 size={22} style={{ color: "var(--color-brand-primary)" }} />
              Sedes y Locales
            </h2>
            <p>Infraestructura física y centros de entrenamiento disponibles</p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarSedes}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spinner" : ""} />
              Actualizar
            </button>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenModal(null)}
              >
                <Plus size={16} />
                Nueva Sede
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEDES GRID */}
      {loading ? (
        <LoadingSpinner text="Cargando sedes..." />
      ) : sedes.length === 0 ? (
        <EmptyState
          title="No hay sedes registradas"
          description="Comienza registrando la sede principal del gimnasio."
          actionLabel={isAdmin ? "Crear Primera Sede" : null}
          onAction={isAdmin ? () => handleOpenModal(null) : null}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {sedes.map((sede) => (
            <div
              key={sede.id}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "24px",
                borderTop: sede.activa
                  ? "4px solid var(--color-brand-primary)"
                  : "4px solid var(--color-danger)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      fontSize: "12px",
                      background: "var(--bg-surface-elevated, #162032)",
                      border: "1px solid var(--border-light)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-brand-primary)",
                    }}
                  >
                    {sede.codigo}
                  </span>
                  <Badge status={sede.activa} />
                </div>

                <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
                  {sede.nombre}
                </h3>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--text-muted)", fontSize: "13px" }}>
                  <MapPin size={16} style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-brand-primary)" }} />
                  <span>{sede.direccion}</span>
                </div>
              </div>

              {isAdmin && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    marginTop: "20px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenModal(sede)}
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: sede.activa ? "var(--color-warning)" : "var(--color-success)" }}
                    onClick={() => handleToggleEstado(sede)}
                  >
                    <Power size={14} />
                    {sede.activa ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: "var(--color-danger)" }}
                    onClick={() => handleEliminar(sede)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={sedeAEditar ? `Editar Sede: ${sedeAEditar.nombre}` : "Registrar Nueva Sede"}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Guardando..." : sedeAEditar ? "Guardar Cambios" : "Crear Sede"}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {errorMsg && (
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
                {errorMsg}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Código Único *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. SEDE-CHINCHA"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre Comercial *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Sede Chincha Centro"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección Completa *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Av. Benavides 450, Chincha Alta"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: "8px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "13.5px",
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "var(--color-brand-primary)" }}
                />
                <span>Sede Activa y Operativa para recepción y cobros</span>
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Sedes;
