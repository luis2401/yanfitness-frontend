import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import {
  sociosService,
  sedesService,
  planesService,
  suscripcionesService,
} from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const METODOS_PAGO = [
  { valor: "EFECTIVO", label: "Efectivo" },
  { valor: "YAPE", label: "Yape (Billetera digital)" },
  { valor: "PLIN", label: "Plin (Billetera digital)" },
  { valor: "TARJETA", label: "Tarjeta Débito / Crédito (POS)" },
  { valor: "TRANSFERENCIA", label: "Transferencia Bancaria" },
];

const FormularioSuscripcionModal = ({
  isOpen,
  onClose,
  socioPreseleccionado = null,
  onSuccess,
}) => {
  const { showToast, sedeTurno } = useAuth();
  const [socios, setSocios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [planesSede, setPlanesSede] = useState([]);
  const [masterPlanes, setMasterPlanes] = useState([]);

  const [precioBaseSede, setPrecioBaseSede] = useState(0);
  const [recargoMultisede, setRecargoMultisede] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    socioId: "",
    sedeId: "",
    planSedeId: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    accesoMultisede: false,
    precioVendido: "",
    precioLista: "",
    observacionPrecio: "",
    metodoPago: "EFECTIVO",
    numeroOperacion: "",
  });

  const calcularFechaFin = (inicioStr, dias) => {
    if (!inicioStr || !dias) return "";
    try {
      const d = new Date(inicioStr + "T00:00:00");
      d.setDate(d.getDate() + Number(dias));
      return d.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const cargarPlanesDeSede = async (sedeId, planesBase = null) => {
    try {
      const plansList = planesBase || masterPlanes;
      const data = await planesService.obtenerPlanesPorSede(sedeId, true);
      const lista = Array.isArray(data) ? data : [];

      // Vincular cada PlanSede con su duración en días del plan maestro
      const combinados = lista.map((ps) => {
        const master = plansList.find(
          (m) => m.id === ps.planId || m.nombre === ps.planNombre
        );
        return {
          ...ps,
          duracionDias: master?.duracionDias || ps.duracionDias || 30,
        };
      });

      setPlanesSede(combinados);

      if (combinados.length > 0) {
        const first = combinados[0];
        const base = Number(first.precioActual ?? first.precioLista ?? 0);
        const rec = Number(first.recargoMultisede ?? 0);
        setPrecioBaseSede(base);
        setRecargoMultisede(rec);
        const finalPrice = form.accesoMultisede ? base + rec : base;
        setForm((prev) => ({
          ...prev,
          planSedeId: first.id,
          precioLista: base,
          precioVendido: finalPrice.toFixed(2),
        }));
      } else {
        setPrecioBaseSede(0);
        setRecargoMultisede(0);
        setForm((prev) => ({
          ...prev,
          planSedeId: "",
          precioLista: "",
          precioVendido: "",
        }));
      }
    } catch {
      setPlanesSede([]);
    }
  };

  // Carga inicial de datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        sociosService.listar().catch(() => []),
        sedesService.listar(true).catch(() => []),
        planesService.listar(true).catch(() => []),
      ]).then(([sociosData, sedesData, masterPlanesData]) => {
        const sList = Array.isArray(sociosData) ? sociosData : [];
        const sedesList = Array.isArray(sedesData) ? sedesData : [];
        const mPlanes = Array.isArray(masterPlanesData) ? masterPlanesData : [];

        setSocios(sList);
        setSedes(sedesList);
        setMasterPlanes(mPlanes);

        const initialSocioId = socioPreseleccionado?.id || (sList?.[0]?.id ?? "");
        const initialSedeId = (sedeTurno && sedesList.some((s) => s.id === sedeTurno.id))
          ? sedeTurno.id
          : (sedesList?.[0]?.id ?? "");

        setForm((prev) => ({
          ...prev,
          socioId: initialSocioId,
          sedeId: initialSedeId,
        }));

        if (initialSedeId) {
          cargarPlanesDeSede(initialSedeId, mPlanes);
        }
      });
      setErrorMsg("");
      setFieldErrors({});
    }
  }, [isOpen, socioPreseleccionado]);

  const handleSedeChange = (e) => {
    const sedeId = e.target.value;
    setForm((prev) => ({ ...prev, sedeId }));
    cargarPlanesDeSede(sedeId);
  };

  const handlePlanChange = (e) => {
    const planSedeId = Number(e.target.value);
    const selected = planesSede.find((p) => p.id === planSedeId);
    const base = Number(selected?.precioActual ?? selected?.precioLista ?? 0);
    const rec = Number(selected?.recargoMultisede ?? 0);
    setPrecioBaseSede(base);
    setRecargoMultisede(rec);
    const finalPrice = form.accesoMultisede ? base + rec : base;
    setForm((prev) => ({
      ...prev,
      planSedeId,
      precioLista: base,
      precioVendido: finalPrice.toFixed(2),
    }));

    if (fieldErrors.planSedeId) {
      setFieldErrors((prev) => ({ ...prev, planSedeId: "" }));
    }
  };

  const handleMultisedeToggle = (e) => {
    const isChecked = e.target.checked;
    const base = Number(precioBaseSede);
    const rec = Number(recargoMultisede);
    const finalPrice = isChecked ? base + rec : base;
    setForm((prev) => ({
      ...prev,
      accesoMultisede: isChecked,
      precioVendido: finalPrice.toFixed(2),
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validarFormulario = () => {
    const errors = {};

    if (!form.socioId) {
      errors.socioId = "Debes seleccionar un socio beneficiario.";
    }

    if (!form.sedeId) {
      errors.sedeId = "Debes seleccionar una sede.";
    }

    if (!form.planSedeId) {
      errors.planSedeId = "Debes seleccionar un plan de membresía.";
    }

    if (!form.fechaInicio) {
      errors.fechaInicio = "La fecha de inicio es obligatoria.";
    }

    const precioNum = Number(form.precioVendido);
    if (!form.precioVendido || isNaN(precioNum) || precioNum <= 0) {
      errors.precioVendido = "El precio a cobrar debe ser un monto numérico mayor a S/ 0.00.";
    }

    setFieldErrors(errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");

    const errors = validarFormulario();
    if (Object.keys(errors).length > 0) {
      setErrorMsg("Por favor completa los campos obligatorios señalados en rojo.");
      return;
    }

    setLoading(true);

    try {
      await suscripcionesService.crear({
        socioId: Number(form.socioId),
        planSedeId: Number(form.planSedeId),
        fechaInicio: form.fechaInicio || null,
        accesoMultisede: form.accesoMultisede,
        precioVendido: Number(form.precioVendido),
        observacionPrecio: form.observacionPrecio.trim() || null,
        metodoPago: form.metodoPago,
        numeroOperacion: form.numeroOperacion.trim() || null,
      });

      // Activación automática del socio tras el cobro exitoso
      await sociosService.cambiarEstado(Number(form.socioId), true).catch(() => {});

      showToast("Membresía registrada y socio activado exitosamente", "success");
      onSuccess();
    } catch (err) {
      setErrorMsg(err.message || "Error al registrar la suscripción.");
    } finally {
      setLoading(false);
    }
  };

  const planSeleccionado = planesSede.find(
    (p) => Number(p.id) === Number(form.planSedeId)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Venta y Activación de Membresía"
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Procesando cobro..." : "Cobrar y Activar Membresía"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
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
              fontWeight: 500,
            }}
          >
            {errorMsg}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Socio Beneficiario *</label>
          <select
            name="socioId"
            value={form.socioId}
            onChange={handleChange}
            className={`form-control ${fieldErrors.socioId ? "is-invalid" : ""}`}
            required
            disabled={Boolean(socioPreseleccionado)}
          >
            <option value="">-- Seleccionar socio --</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} {s.apellido} (DNI: {s.dni})
              </option>
            ))}
          </select>
          {fieldErrors.socioId && (
            <span className="field-error-text">⚠️ {fieldErrors.socioId}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Sede Base *</label>
            <select
              name="sedeId"
              value={form.sedeId}
              onChange={handleSedeChange}
              className={`form-control ${fieldErrors.sedeId ? "is-invalid" : ""}`}
              required
            >
              {sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
            {fieldErrors.sedeId && (
              <span className="field-error-text">⚠️ {fieldErrors.sedeId}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Plan de Membresía (con Duración en Días) *</label>
            <select
              name="planSedeId"
              value={form.planSedeId}
              onChange={handlePlanChange}
              className={`form-control ${fieldErrors.planSedeId ? "is-invalid" : ""}`}
              required
            >
              {planesSede.length === 0 ? (
                <option value="">Sin planes asignados a esta sede</option>
              ) : (
                planesSede.map((p) => {
                  const pVal = p.precioActual ?? p.precioLista ?? 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.planNombre} ({p.duracionDias} días de vigencia) — Tarifa: S/ {Number(pVal).toFixed(2)}
                    </option>
                  );
                })
              )}
            </select>
            {fieldErrors.planSedeId && (
              <span className="field-error-text">⚠️ {fieldErrors.planSedeId}</span>
            )}
          </div>
        </div>

        {/* DESGLOSE DETALLADO DE TARIFAS Y DURACIÓN DEL PLAN */}
        {form.planSedeId && (
          <div
            style={{
              background: "var(--bg-surface-elevated, #162032)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "16px 18px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "10px",
                letterSpacing: "0.5px",
              }}
            >
              Detalles del Plan y Desglose de Tarifas
            </div>

            {/* DÍAS DEL PLAN */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13.5px",
                marginBottom: "8px",
                paddingBottom: "8px",
                borderBottom: "1px dashed var(--border-light)",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                ⏱️ Duración del Plan:
              </span>
              <strong style={{ color: "var(--color-brand-primary)", fontSize: "14px" }}>
                {planSeleccionado?.duracionDias || 30} días de cobertura
              </strong>
            </div>

            {/* VIGENCIA ESTIMADA */}
            {form.fechaInicio && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginBottom: "8px",
                  paddingBottom: "8px",
                  borderBottom: "1px dashed var(--border-light)",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>📅 Periodo Estimado:</span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  {new Date(form.fechaInicio + "T00:00:00").toLocaleDateString("es-PE")} →{" "}
                  <strong style={{ color: "var(--color-brand-primary)" }}>
                    {calcularFechaFin(form.fechaInicio, planSeleccionado?.duracionDias || 30)}
                  </strong>
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13.5px",
                marginBottom: "6px",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Precio Base de Lista en Sede:</span>
              <strong style={{ color: "var(--text-main)" }}>S/ {Number(precioBaseSede || 0).toFixed(2)}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13.5px",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: form.accesoMultisede ? "var(--color-accent)" : "var(--text-muted)" }}>
                Recargo Acceso Multisede {form.accesoMultisede ? "(Aplicado)" : "(Desactivado)"}:
              </span>
              <strong style={{ color: form.accesoMultisede ? "var(--color-accent)" : "var(--text-muted)" }}>
                + S/ {Number(recargoMultisede || 0).toFixed(2)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "15px",
                paddingTop: "8px",
                borderTop: "1px solid var(--border-light)",
                color: "var(--color-brand-primary)",
              }}
            >
              <span style={{ fontWeight: 800 }}>Total Calculado a Cobrar:</span>
              <strong style={{ fontWeight: 800 }}>S/ {Number(form.precioVendido || 0).toFixed(2)}</strong>
            </div>
          </div>
        )}

        <div className="form-group">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "13.5px",
              fontWeight: 600,
              padding: "6px 0",
            }}
          >
            <input
              type="checkbox"
              name="accesoMultisede"
              checked={form.accesoMultisede}
              onChange={handleMultisedeToggle}
              style={{ width: "18px", height: "18px", accentColor: "var(--color-brand-primary)" }}
            />
            Habilitar acceso Multisede (+ S/ {Number(recargoMultisede || 0).toFixed(2)} para entrenar en todas las sedes)
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Fecha de Inicio *</label>
            <input
              type="date"
              name="fechaInicio"
              value={form.fechaInicio}
              onChange={handleChange}
              className={`form-control ${fieldErrors.fechaInicio ? "is-invalid" : ""}`}
              required
            />
            {fieldErrors.fechaInicio && (
              <span className="field-error-text">⚠️ {fieldErrors.fechaInicio}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Monto Final Vendido (S/) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="precioVendido"
              value={form.precioVendido}
              onChange={handleChange}
              placeholder="0.00"
              className={`form-control ${fieldErrors.precioVendido ? "is-invalid" : ""}`}
              required
            />
            {fieldErrors.precioVendido && (
              <span className="field-error-text">⚠️ {fieldErrors.precioVendido}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Método de Pago *</label>
            <select
              name="metodoPago"
              value={form.metodoPago}
              onChange={handleChange}
              className="form-control"
              required
            >
              {METODOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nro. de Operación / Voucher</label>
            <input
              type="text"
              name="numeroOperacion"
              value={form.numeroOperacion}
              onChange={handleChange}
              placeholder="Ej. OP-984321 / Yape 1234"
              className="form-control"
              maxLength={48}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Observación del Cobro / Motivo de Descuento</label>
          <input
            type="text"
            name="observacionPrecio"
            value={form.observacionPrecio}
            onChange={handleChange}
            placeholder="Opcional. Ej. Descuento promocional de apertura"
            className="form-control"
            maxLength={500}
          />
        </div>
      </form>
    </Modal>
  );
};

export default FormularioSuscripcionModal;
