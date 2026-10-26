import React, { useState, useEffect } from "react";
import { planesService, sedesService } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import { Dumbbell, Plus, Edit2, Power, Trash2, RefreshCw, DollarSign, Tag } from "lucide-react";

const Planes = () => {
  const { isAdmin, showToast } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit
  const [modalPlanOpen, setModalPlanOpen] = useState(false);
  const [planAEditar, setPlanAEditar] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [errorPlan, setErrorPlan] = useState("");

  const [formPlan, setFormPlan] = useState({
    nombre: "",
    duracionDias: 30,
    activo: true,
    condiciones: "",
  });

  // Modal Precios por Sede
  const [modalPrecioOpen, setModalPrecioOpen] = useState(false);
  const [planParaPrecio, setPlanParaPrecio] = useState(null);
  const [preciosActuales, setPreciosActuales] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState("");
  const [precioLista, setPrecioLista] = useState("");
  const [recargoMultisede, setRecargoMultisede] = useState("0.00");
  const [savingPrecio, setSavingPrecio] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [planesData, sedesData] = await Promise.all([
        planesService.listar(false).catch(() => []),
        sedesService.listar(true).catch(() => []),
      ]);
      setPlanes(Array.isArray(planesData) ? planesData : planesData?.content || []);
      setSedes(Array.isArray(sedesData) ? sedesData : sedesData?.content || []);
    } catch (err) {
      showToast(err.message || "Error al cargar catálogo de planes", "error");
      setPlanes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleOpenPlanModal = (plan = null) => {
    setPlanAEditar(plan);
    if (plan) {
      setFormPlan({
        nombre: plan.nombre || "",
        duracionDias: plan.duracionDias || 30,
        activo: plan.activo,
        condiciones: plan.condiciones || "",
      });
    } else {
      setFormPlan({
        nombre: "",
        duracionDias: 30,
        activo: true,
        condiciones: "Acceso libre a zona de musculación y cardio.",
      });
    }
    setErrorPlan("");
    setModalPlanOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setErrorPlan("");

    if (!formPlan.nombre.trim()) {
      setErrorPlan("El nombre del plan de membresía es obligatorio.");
      return;
    }
    const dias = Number(formPlan.duracionDias);
    if (!formPlan.duracionDias || isNaN(dias) || dias <= 0) {
      setErrorPlan("La duración en días debe ser un número entero mayor a 0 (ej. 30).");
      return;
    }

    setSavingPlan(true);
    try {
      if (planAEditar) {
        await planesService.actualizar(planAEditar.id, {
          nombre: formPlan.nombre.trim(),
          duracionDias: dias,
          activo: formPlan.activo,
          condiciones: formPlan.condiciones?.trim() || null,
        });
        showToast("Plan actualizado exitosamente", "success");
      } else {
        await planesService.crear({
          nombre: formPlan.nombre.trim(),
          duracionDias: dias,
          activo: formPlan.activo,
          condiciones: formPlan.condiciones?.trim() || null,
        });
        showToast("Plan creado exitosamente", "success");
      }
      setModalPlanOpen(false);
      cargarDatos();
    } catch (err) {
      setErrorPlan(err.message || "Error al guardar el plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleOpenPreciosModal = async (plan) => {
    setPlanParaPrecio(plan);
    const initialSede = sedes[0]?.id ? String(sedes[0].id) : "";
    setSedeSeleccionada(initialSede);
    setPrecioLista("120.00");
    setRecargoMultisede("20.00");
    try {
      const p = await planesService.obtenerPreciosPorPlan(plan.id);
      const lista = Array.isArray(p) ? p : [];
      setPreciosActuales(lista);
      const match = lista.find((x) => String(x.sedeId) === String(initialSede));
      if (match) {
        const pVal = match.precioActual ?? match.precioLista ?? 120;
        const rVal = match.recargoMultisede ?? 0;
        setPrecioLista(String(pVal));
        setRecargoMultisede(String(rVal));
      }
    } catch {
      setPreciosActuales([]);
    }
    setModalPrecioOpen(true);
  };

  const handleSedeSeleccionadaChange = (nuevaSedeId) => {
    setSedeSeleccionada(nuevaSedeId);
    const match = preciosActuales.find((x) => String(x.sedeId) === String(nuevaSedeId));
    if (match) {
      const pVal = match.precioActual ?? match.precioLista ?? 120;
      const rVal = match.recargoMultisede ?? 0;
      setPrecioLista(String(pVal));
      setRecargoMultisede(String(rVal));
    } else {
      setPrecioLista("120.00");
      setRecargoMultisede("20.00");
    }
  };

  const handleSavePrecioSede = async (e) => {
    e.preventDefault();
    if (!planParaPrecio || !sedeSeleccionada) return;

    const numericPrecio = Number(precioLista);
    if (!precioLista || isNaN(numericPrecio) || numericPrecio <= 0) {
      showToast("El precio regular debe ser un monto mayor a S/ 0.00", "error");
      return;
    }

    setSavingPrecio(true);
    try {
      const numericRecargo = Number(recargoMultisede || 0);

      await planesService.asignarPrecioSede(planParaPrecio.id, {
        sedeId: Number(sedeSeleccionada),
        precioActual: numericPrecio,
        precioLista: numericPrecio,
        recargoMultisede: numericRecargo,
        activo: true,
      });
      showToast("Tarifa por sede guardada correctamente", "success");
      const updated = await planesService.obtenerPreciosPorPlan(planParaPrecio.id);
      setPreciosActuales(Array.isArray(updated) ? updated : []);
      cargarDatos();
    } catch (err) {
      showToast(err.message || "Error al guardar tarifa", "error");
    } finally {
      setSavingPrecio(false);
    }
  };

  const handleToggleEstado = async (plan) => {
    try {
      await planesService.cambiarEstado(plan.id, !plan.activo);
      showToast(`Plan ${!plan.activo ? "activado" : "desactivado"}`, "success");
      cargarDatos();
    } catch (err) {
      showToast(err.message || "Error al cambiar estado", "error");
    }
  };

  const handleEliminar = async (plan) => {
    const ok = window.confirm(`¿Estás seguro de eliminar el plan "${plan.nombre}"?`);
    if (!ok) return;
    try {
      await planesService.eliminar(plan.id);
      showToast("Plan eliminado del catálogo", "success");
      cargarDatos();
    } catch (err) {
      showToast(err.message || "No se pudo eliminar el plan", "error");
    }
  };

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Dumbbell size={22} style={{ color: "var(--color-brand-primary)" }} />
              Planes de Membresía y Tarifas
            </h2>
            <p>Catálogo de planes, vigencias en días y tarifas por sede</p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarDatos}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spinner" : ""} />
              Actualizar
            </button>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenPlanModal(null)}
              >
                <Plus size={16} />
                Nuevo Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PLANS GRID */}
      {loading ? (
        <LoadingSpinner text="Cargando catálogo de planes..." />
      ) : planes.length === 0 ? (
        <EmptyState
          title="No hay planes configurados"
          description="Crea planes de membresía (mensual, trimestral, anual) para empezar a vender suscripciones."
          actionLabel={isAdmin ? "Crear Primer Plan" : null}
          onAction={isAdmin ? () => handleOpenPlanModal(null) : null}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {planes.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "24px",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      background: "var(--color-brand-light)",
                      color: "var(--color-brand-primary)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {plan.duracionDias} días de vigencia
                  </span>
                  <Badge status={plan.activo} />
                </div>

                <h3 style={{ margin: "0 0 8px 0", fontSize: "19px", fontWeight: 800, color: "var(--text-main)" }}>
                  {plan.nombre}
                </h3>

                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                  {plan.condiciones || "Sin condiciones especiales especificadas."}
                </p>

                {/* Precios asignados */}
                <div
                  style={{
                    background: "var(--bg-surface-elevated, #162032)",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Tarifas por Sede ({plan.preciosSedes?.length || 0})
                  </div>
                  {plan.preciosSedes && plan.preciosSedes.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {plan.preciosSedes.map((ps) => {
                        const val = ps.precioActual ?? ps.precioLista ?? 0;
                        return (
                          <div
                            key={ps.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12.5px",
                            }}
                          >
                            <span style={{ color: "var(--text-secondary)" }}>{ps.sedeNombre}:</span>
                            <strong style={{ color: "var(--color-brand-primary)" }}>S/ {Number(val).toFixed(2)}</strong>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-disabled)" }}>
                      Sin precios asignados a sedes
                    </span>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--border-light)",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: "var(--color-brand-primary)" }}
                    onClick={() => handleOpenPreciosModal(plan)}
                  >
                    <DollarSign size={14} />
                    Asignar Precios
                  </button>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenPlanModal(plan)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: plan.activo ? "var(--color-warning)" : "var(--color-success)" }}
                      onClick={() => handleToggleEstado(plan)}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: "var(--color-danger)" }}
                      onClick={() => handleEliminar(plan)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PLAN MODAL */}
      {modalPlanOpen && (
        <Modal
          isOpen={modalPlanOpen}
          onClose={() => setModalPlanOpen(false)}
          title={planAEditar ? `Editar Plan: ${planAEditar.nombre}` : "Crear Nuevo Plan de Membresía"}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalPlanOpen(false)}
                disabled={savingPlan}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePlan}
                disabled={savingPlan}
              >
                {savingPlan ? "Guardando..." : planAEditar ? "Guardar Cambios" : "Crear Plan"}
              </button>
            </>
          }
        >
          <form onSubmit={handleSavePlan}>
            {errorPlan && (
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
                {errorPlan}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nombre del Plan *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Plan Mensual Full, Trimestre Pro..."
                value={formPlan.nombre}
                onChange={(e) => setFormPlan({ ...formPlan, nombre: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duración en Días *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="Ej. 30 para un mes, 90 para trimestre..."
                value={formPlan.duracionDias}
                onChange={(e) => setFormPlan({ ...formPlan, duracionDias: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Condiciones / Beneficios</label>
              <textarea
                className="form-control"
                placeholder="Ej. Acceso a todas las máquinas, duchas, casilleros..."
                value={formPlan.condiciones}
                onChange={(e) => setFormPlan({ ...formPlan, condiciones: e.target.value })}
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
                  checked={formPlan.activo}
                  onChange={(e) => setFormPlan({ ...formPlan, activo: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "var(--color-brand-primary)" }}
                />
                <span>Plan Activo para venta a clientes</span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* ASIGNAR PRECIOS POR SEDE MODAL */}
      {modalPrecioOpen && planParaPrecio && (
        <Modal
          isOpen={modalPrecioOpen}
          onClose={() => setModalPrecioOpen(false)}
          title={`Tarifas por Sede: ${planParaPrecio.nombre}`}
          size="lg"
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalPrecioOpen(false)}
            >
              Cerrar
            </button>
          }
        >
          <div>
            <div style={{ marginBottom: "16px", fontSize: "13.5px", color: "var(--text-secondary)" }}>
              Asigna o actualiza el precio de venta de este plan según la sede física correspondiente.
            </div>

            {/* Existing prices table */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 700 }}>Precios Vigentes</h4>
              {preciosActuales.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Aún no se ha configurado ningún precio para este plan.
                </p>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Sede</th>
                      <th>Precio de Lista</th>
                      <th>Recargo Multisede</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preciosActuales.map((item) => {
                      const pVal = item.precioActual ?? item.precioLista ?? 0;
                      const rVal = item.recargoMultisede ?? 0;
                      return (
                        <tr key={item.id}>
                          <td><strong>{item.sedeNombre || `Sede #${item.sedeId}`}</strong></td>
                          <td style={{ color: "var(--color-brand-primary)", fontWeight: 700 }}>
                            S/ {Number(pVal).toFixed(2)}
                          </td>
                          <td>+ S/ {Number(rVal).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Form to assign new price */}
            <div
              style={{
                background: "var(--bg-surface-elevated, #162032)",
                padding: "16px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
              }}
            >
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700 }}>
                Establecer o Actualizar Tarifa para una Sede
              </h4>
              <form onSubmit={handleSavePrecioSede}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sede *</label>
                    <select
                      className="form-control"
                      value={sedeSeleccionada}
                      onChange={(e) => handleSedeSeleccionadaChange(e.target.value)}
                      required
                    >
                      {sedes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio Regular (S/) *</label>
                    <input
                      type="number"
                      step="0.50"
                      className="form-control"
                      value={precioLista}
                      onChange={(e) => setPrecioLista(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Recargo Multisede (S/)</label>
                    <input
                      type="number"
                      step="0.50"
                      className="form-control"
                      value={recargoMultisede}
                      onChange={(e) => setRecargoMultisede(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingPrecio}
                  >
                    {savingPrecio ? "Guardando tarifa..." : "Guardar Tarifa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Planes;
