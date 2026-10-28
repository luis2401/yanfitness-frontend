import React, { useState, useEffect, useMemo } from "react";
import Modal from "../common/Modal";
import {
  sociosService,
  sedesService,
  planesService,
  suscripcionesService,
  pagosService,
} from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { generarNop } from "../../utils/formatters";

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
  onSwitchToPaseDiario = null,
}) => {
  const { usuario, showToast, sedeTurno } = useAuth();
  const [socios, setSocios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [planesSede, setPlanesSede] = useState([]);
  const [masterPlanes, setMasterPlanes] = useState([]);
  const [suscripcionesActivas, setSuscripcionesActivas] = useState([]);
  const [pagosExistentes, setPagosExistentes] = useState([]);

  const [precioBaseSede, setPrecioBaseSede] = useState(0);
  const [recargoMultisede, setRecargoMultisede] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  };

  const sumarDiasISO = (fechaIso, dias) => {
    if (!fechaIso) return getLocalToday();
    try {
      const d = new Date(fechaIso + "T00:00:00");
      d.setDate(d.getDate() + Number(dias));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    } catch {
      return fechaIso;
    }
  };

  const [form, setForm] = useState({
    socioId: "",
    sedeId: "",
    planSedeId: "",
    fechaInicio: getLocalToday(),
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

  const formatearFechaCorta = (isoStr) => {
    if (!isoStr) return "";
    try {
      return new Date(isoStr + "T00:00:00").toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  // Obtener la suscripción activa de mayor fechaFin para un socio dado
  const encontrarUltimaSuscripcionActiva = (socioIdBuscado, listaSubs = suscripcionesActivas) => {
    if (!socioIdBuscado || !Array.isArray(listaSubs)) return null;
    const hoy = getLocalToday();
    const delSocio = listaSubs.filter(
      (s) =>
        Number(s.socioId || s.socio?.id) === Number(socioIdBuscado) &&
        s.estado === "ACTIVA" &&
        s.fechaFin &&
        s.fechaFin >= hoy
    );
    if (delSocio.length === 0) return null;
    return delSocio.reduce((max, actual) => (actual.fechaFin > max.fechaFin ? actual : max), delSocio[0]);
  };

  const suscripcionVigenteSocio = useMemo(
    () => encontrarUltimaSuscripcionActiva(form.socioId, suscripcionesActivas),
    [form.socioId, suscripcionesActivas]
  );

  const cargarPlanesDeSede = async (sedeId, planesBase = null) => {
    try {
      const plansList = planesBase || masterPlanes;
      const data = await planesService.obtenerPlanesPorSede(sedeId, true);
      const lista = Array.isArray(data) ? data : [];

      const combinados = lista.map((ps) => {
        const master = plansList.find(
          (m) => m.id === ps.planId || m.nombre === ps.planNombre
        );
        return {
          ...ps,
          duracionDias: master?.duracionDias || ps.duracionDias || 30,
          condiciones: master?.condiciones || ps.condiciones || "",
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

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        sociosService.listar().catch(() => []),
        sedesService.listar(true).catch(() => []),
        planesService.listar(true).catch(() => []),
        suscripcionesService.listar({ estado: "ACTIVA" }).catch(() => []),
        pagosService.listar().catch(() => []),
      ]).then(([sociosData, sedesData, masterPlanesData, subsData, pagosData]) => {
        let sList = Array.isArray(sociosData) ? sociosData : sociosData?.content || [];
        const sedesList = Array.isArray(sedesData) ? sedesData : sedesData?.content || [];
        const mPlanes = Array.isArray(masterPlanesData) ? masterPlanesData : masterPlanesData?.content || [];
        const aSubs = Array.isArray(subsData) ? subsData : subsData?.content || [];
        const pList = Array.isArray(pagosData) ? pagosData : pagosData?.content || [];

        if (
          socioPreseleccionado?.id &&
          !sList.some((s) => Number(s.id) === Number(socioPreseleccionado.id))
        ) {
          sList = [socioPreseleccionado, ...sList];
        }

        setSocios(sList);
        setSedes(sedesList);
        setMasterPlanes(mPlanes);
        setSuscripcionesActivas(aSubs);
        setPagosExistentes(pList);

        const initialSocioId = socioPreseleccionado?.id || (sList?.[0]?.id ?? "");
        const initialSedeId =
          sedeTurno && sedesList.some((s) => s.id === sedeTurno.id)
            ? sedeTurno.id
            : sedesList?.[0]?.id ?? "";

        const subPrevia = encontrarUltimaSuscripcionActiva(initialSocioId, aSubs);
        const fechaInicioSugerida = subPrevia?.fechaFin ? subPrevia.fechaFin : getLocalToday();

        const sedeObj = sedesList.find((s) => Number(s.id) === Number(initialSedeId));
        const nopInicial = generarNop({
          sedeNombre: sedeObj?.nombre || "Sede Central",
          vendedorNombre: usuario?.nombre || "Admin Principal",
          metodoPago: "EFECTIVO",
        });

        setForm((prev) => ({
          ...prev,
          socioId: initialSocioId,
          sedeId: initialSedeId,
          fechaInicio: fechaInicioSugerida,
          observacionPrecio: "",
          numeroOperacion: nopInicial,
        }));

        if (initialSedeId) {
          cargarPlanesDeSede(initialSedeId, mPlanes);
        }
      });
      setErrorMsg("");
      setFieldErrors({});
    }
  }, [isOpen, socioPreseleccionado, usuario]);

  const handleRegenerarNop = () => {
    const sedeObj = sedes.find((s) => Number(s.id) === Number(form.sedeId));
    const nuevoNop = generarNop({
      sedeNombre: sedeObj?.nombre || "Sede Central",
      vendedorNombre: usuario?.nombre || "Admin Principal",
      metodoPago: form.metodoPago,
    });
    setForm((prev) => ({ ...prev, numeroOperacion: nuevoNop }));
  };

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

    if (name === "socioId") {
      const subPrevia = encontrarUltimaSuscripcionActiva(value, suscripcionesActivas);
      const nuevaFechaInicio = subPrevia?.fechaFin ? subPrevia.fechaFin : getLocalToday();
      setForm((prev) => ({
        ...prev,
        socioId: value,
        fechaInicio: nuevaFechaInicio,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errorMsg) {
      setErrorMsg("");
    }
  };

  const validarFormulario = () => {
    const errors = {};

    if (!form.socioId) {
      errors.socioId = "Selecciona un socio beneficiario.";
    }

    if (!form.sedeId) {
      errors.sedeId = "Selecciona una sede base.";
    }

    if (!form.planSedeId) {
      errors.planSedeId = "Selecciona un plan de membresía.";
    }

    if (!form.fechaInicio) {
      errors.fechaInicio = "La fecha de inicio es obligatoria.";
    }

    const precioNum = Number(form.precioVendido);
    if (!form.precioVendido || isNaN(precioNum) || precioNum <= 0) {
      errors.precioVendido = "El importe a cobrar debe ser mayor a S/ 0.00.";
    }

    const nroOp = (form.numeroOperacion || "").trim();
    if (
      nroOp &&
      pagosExistentes.some(
        (p) => p.numeroOperacion && p.numeroOperacion.trim().toLowerCase() === nroOp.toLowerCase()
      )
    ) {
      errors.numeroOperacion = `El número de operación "${nroOp}" ya fue registrado en otro comprobante.`;
    }

    setFieldErrors(errors);
    return errors;
  };

  const socioActualObj =
    socios.find((s) => Number(s.id) === Number(form.socioId)) ||
    (socioPreseleccionado && Number(socioPreseleccionado.id) === Number(form.socioId)
      ? socioPreseleccionado
      : null);

  const planSeleccionado = planesSede.find(
    (p) => Number(p.id) === Number(form.planSedeId)
  );

  // Si el socio tiene membresía vigente, la fecha efectiva de inicio será su último día de suscripción (o posterior si el usuario eligió más adelante)
  const fechaInicioEfectiva = useMemo(() => {
    if (suscripcionVigenteSocio?.fechaFin) {
      if (!form.fechaInicio || form.fechaInicio < suscripcionVigenteSocio.fechaFin) {
        return suscripcionVigenteSocio.fechaFin;
      }
    }
    return form.fechaInicio || getLocalToday();
  }, [form.fechaInicio, suscripcionVigenteSocio]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");

    const errors = validarFormulario();
    if (Object.keys(errors).length > 0) {
      const primerMensaje = Object.values(errors)[0];
      setErrorMsg(primerMensaje || "Revisa los campos resaltados antes de continuar.");
      return;
    }

    setLoading(true);
    const estabaInactivo = socioActualObj ? !socioActualObj.activo : true;

    try {
      // Aseguramos que el socio esté activo antes de registrar la suscripción
      await sociosService.cambiarEstado(Number(form.socioId), true).catch(() => {});

      const precioEsperadoLista =
        Number(precioBaseSede || 0) + (form.accesoMultisede ? Number(recargoMultisede || 0) : 0);
      const precioCobrado = Number(form.precioVendido);
      const difiereDeLista =
        precioEsperadoLista > 0 && Math.abs(precioCobrado - precioEsperadoLista) > 0.009;

      const observacionFinal =
        form.observacionPrecio.trim() ||
        (difiereDeLista
          ? `Ajuste de tarifa en caja (Precio lista: S/ ${precioEsperadoLista.toFixed(2)})`
          : suscripcionVigenteSocio
          ? `Extensión continua desde último día de membresía (${suscripcionVigenteSocio.fechaFin})`
          : null);

      const payload = {
        socioId: Number(form.socioId),
        planSedeId: Number(form.planSedeId),
        fechaInicio: fechaInicioEfectiva,
        accesoMultisede: Boolean(form.accesoMultisede),
        precioVendido: precioCobrado,
        observacionPrecio: observacionFinal,
        metodoPago: form.metodoPago,
        numeroOperacion: form.numeroOperacion.trim() || null,
      };

      try {
        await suscripcionesService.crear(payload);
      } catch (firstErr) {
        // Fallback preventivo si el servidor aún está aplicando el despliegue y requiere +1 día sobre fechaFin
        if (firstErr?.status === 409 && suscripcionVigenteSocio?.fechaFin) {
          await suscripcionesService.crear({
            ...payload,
            fechaInicio: sumarDiasISO(suscripcionVigenteSocio.fechaFin, 1),
          });
        } else {
          throw firstErr;
        }
      }

      if (suscripcionVigenteSocio) {
        showToast(
          `Membresía renovada: se sumaron +${planSeleccionado?.duracionDias || 30} días a partir del ${formatearFechaCorta(
            suscripcionVigenteSocio.fechaFin
          )}`,
          "success"
        );
      } else {
        showToast("Membresía registrada y socio activado exitosamente", "success");
      }
      onSuccess();
    } catch (err) {
      if (estabaInactivo && !suscripcionVigenteSocio) {
        await sociosService.cambiarEstado(Number(form.socioId), false).catch(() => {});
      }
      setErrorMsg(err.message || "No se pudo completar el registro de la suscripción.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        socioPreseleccionado
          ? `Venta de Membresía — ${socioPreseleccionado.nombre} ${socioPreseleccionado.apellido || ""}`
          : "Venta y Activación de Membresía"
      }
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {socioPreseleccionado && !socioActualObj?.activo
              ? "Dejar sin membresía (Inactivo)"
              : "Cancelar"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Procesando cobro..."
              : suscripcionVigenteSocio
              ? `Cobrar y Sumar +${planSeleccionado?.duracionDias || 30} Días`
              : "Cobrar y Activar Membresía"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {errorMsg && (
          <div className="notice-box notice-box-warning">
            <span>ℹ️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AVISO INFORMATIVO AUTOMÁTICO CUANDO EL SOCIO YA TIENE MEMBRESÍA ACTIVA */}
        {suscripcionVigenteSocio && (
          <div className="notice-box notice-box-emerald">
            <span style={{ fontSize: "16px", lineHeight: 1.2 }}>✨</span>
            <div>
              <div style={{ fontWeight: 600, color: "#6ee7b7", marginBottom: "2px" }}>
                Extensión Continua de Membresía Detectada
              </div>
              <div style={{ fontSize: "12.5px", color: "#d1fae5" }}>
                El socio ya cuenta con el plan <strong>{suscripcionVigenteSocio.nombrePlanVendido}</strong> vigente hasta el{" "}
                <strong>{formatearFechaCorta(suscripcionVigenteSocio.fechaFin)}</strong>. El nuevo plan tomará automáticamente ese último día y sumará{" "}
                <strong>+{planSeleccionado?.duracionDias || 30} días</strong>, extendiendo su cobertura hasta el{" "}
                <strong>
                  {calcularFechaFin(
                    fechaInicioEfectiva,
                    planSeleccionado?.duracionDias || 30
                  )}
                </strong>.
              </div>
            </div>
          </div>
        )}

        {/* RESUMEN DEL SOCIO SELECCIONADO / RECIÉN REGISTRADO */}
        {socioActualObj && (
          <div
            className="info-banner-animated"
            style={{
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Datos del Socio
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  marginTop: "2px",
                }}
              >
                {socioActualObj.nombre} {socioActualObj.apellido || ""}
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                <span>
                  DNI: <strong>{socioActualObj.dni}</strong>
                </span>
                {socioActualObj.telefono && <span>Tel: {socioActualObj.telefono}</span>}
                {socioActualObj.correo && <span>{socioActualObj.correo}</span>}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "6px",
              }}
            >
              <span
                className={`badge ${
                  suscripcionVigenteSocio
                    ? "badge-info"
                    : socioActualObj.activo
                    ? "badge-success"
                    : "badge-warning"
                }`}
                style={{ fontSize: "11.5px" }}
              >
                {suscripcionVigenteSocio
                  ? `Vigente hasta ${formatearFechaCorta(suscripcionVigenteSocio.fechaFin)} · Se sumará el plan`
                  : socioActualObj.activo
                  ? "Socio Activo"
                  : "Inactivo · Se activará al cobrar"}
              </span>

              {onSwitchToPaseDiario && !suscripcionVigenteSocio && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "11.5px", padding: "4px 10px" }}
                  onClick={() => onSwitchToPaseDiario(socioActualObj)}
                >
                  ¿Solo desea Pase Diario por 1 día?
                </button>
              )}
            </div>
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
            {socios.map((s) => {
              const subS = encontrarUltimaSuscripcionActiva(s.id, suscripcionesActivas);
              return (
                <option key={s.id} value={s.id}>
                  {s.nombre} {s.apellido || ""} (DNI: {s.dni}) —{" "}
                  {subS
                    ? `Con plan hasta ${formatearFechaCorta(subS.fechaFin)}`
                    : s.activo
                    ? "Activo"
                    : "Inactivo"}
                </option>
              );
            })}
          </select>
          {fieldErrors.socioId && (
            <span className="field-error-text">ℹ️ {fieldErrors.socioId}</span>
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
              <span className="field-error-text">ℹ️ {fieldErrors.sedeId}</span>
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
                      {p.planNombre} (+{p.duracionDias} días) — Tarifa: S/ {Number(pVal).toFixed(2)}
                    </option>
                  );
                })
              )}
            </select>
            {fieldErrors.planSedeId && (
              <span className="field-error-text">ℹ️ {fieldErrors.planSedeId}</span>
            )}
          </div>
        </div>

        {/* DESGLOSE DETALLADO DE TARIFAS Y DURACIÓN DEL PLAN */}
        {form.planSedeId && (
          <div
            className="info-banner-animated"
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
              Detalles del Plan y Desglose de Cobertura
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
                ⏱️ Duración a sumar:
              </span>
              <strong style={{ color: "var(--color-brand-primary)", fontSize: "14px" }}>
                +{planSeleccionado?.duracionDias || 30} días de cobertura
              </strong>
            </div>

            {/* VIGENCIA ESTIMADA */}
            {fechaInicioEfectiva && (
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
                <span style={{ color: "var(--text-muted)" }}>
                  📅 {suscripcionVigenteSocio ? "Extensión desde último día:" : "Periodo de Vigencia:"}
                </span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  {formatearFechaCorta(fechaInicioEfectiva)} →{" "}
                  <strong style={{ color: "var(--color-brand-primary)" }}>
                    {calcularFechaFin(fechaInicioEfectiva, planSeleccionado?.duracionDias || 30)}
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
              <strong style={{ color: "var(--text-main)" }}>
                S/ {Number(precioBaseSede || 0).toFixed(2)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13.5px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  color: form.accesoMultisede ? "var(--color-accent)" : "var(--text-muted)",
                }}
              >
                Recargo Acceso Multisede {form.accesoMultisede ? "(Aplicado)" : "(Desactivado)"}:
              </span>
              <strong
                style={{
                  color: form.accesoMultisede ? "var(--color-accent)" : "var(--text-muted)",
                }}
              >
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
              <span style={{ fontWeight: 700 }}>Total Calculado a Cobrar:</span>
              <strong style={{ fontWeight: 700 }}>
                S/ {Number(form.precioVendido || 0).toFixed(2)}
              </strong>
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
              style={{
                width: "18px",
                height: "18px",
                accentColor: "var(--color-brand-primary)",
              }}
            />
            Habilitar acceso Multisede (+ S/ {Number(recargoMultisede || 0).toFixed(2)} para entrenar
            en todas las sedes)
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              {suscripcionVigenteSocio
                ? "Inicio del Nuevo Plan (Último día de suscripción actual) *"
                : "Fecha de Inicio *"}
            </label>
            <input
              type="date"
              name="fechaInicio"
              value={fechaInicioEfectiva}
              min={suscripcionVigenteSocio?.fechaFin || undefined}
              onChange={handleChange}
              className={`form-control ${fieldErrors.fechaInicio ? "is-invalid" : ""}`}
              required
            />
            {fieldErrors.fechaInicio && (
              <span className="field-error-text">ℹ️ {fieldErrors.fechaInicio}</span>
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
              <span className="field-error-text">ℹ️ {fieldErrors.precioVendido}</span>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label className="form-label" style={{ margin: 0 }}>Nro. de Operación (NOP) *</label>
              <button
                type="button"
                onClick={handleRegenerarNop}
                style={{ background: "none", border: "none", color: "var(--color-brand-primary)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
              >
                🔄 Nuevo NOP
              </button>
            </div>
            <input
              type="text"
              name="numeroOperacion"
              value={form.numeroOperacion}
              onChange={handleChange}
              placeholder="Ej. SC-LVE-849201"
              className={`form-control ${fieldErrors.numeroOperacion ? "is-invalid" : ""}`}
              maxLength={48}
              required
            />
            {fieldErrors.numeroOperacion && (
              <span className="field-error-text">ℹ️ {fieldErrors.numeroOperacion}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Observación del Cobro / Motivo de Descuento</label>
          <input
            type="text"
            name="observacionPrecio"
            value={form.observacionPrecio}
            onChange={handleChange}
            placeholder="Opcional. Ej. Descuento promocional o renovación anticipada"
            className="form-control"
            maxLength={500}
          />
        </div>
      </form>
    </Modal>
  );
};

export default FormularioSuscripcionModal;
