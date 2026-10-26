import React, { useState, useEffect, useMemo } from "react";
import Modal from "../common/Modal";
import { sedesService, pagosService, sociosService } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { Users, UserPlus, Search, CheckCircle2 } from "lucide-react";

const FormularioPaseDiarioModal = ({
  isOpen,
  onClose,
  onSuccess,
  socioPreseleccionado = null,
}) => {
  const { showToast, sedeTurno } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // "SOCIO_EXISTENTE" | "VISITANTE_EXTERNO"
  const [modoCliente, setModoCliente] = useState("SOCIO_EXISTENTE");
  const [busquedaSocio, setBusquedaSocio] = useState("");
  const [socioElegidoId, setSocioElegidoId] = useState("");

  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const [form, setForm] = useState({
    sedeId: "",
    visitanteNombre: "",
    visitanteDocumento: "",
    fechaAcceso: getLocalToday(),
    monto: "20.00",
    metodoPago: "EFECTIVO",
    numeroOperacion: "",
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        sedesService.listar(true).catch(() => []),
        sociosService.listar().catch(() => []),
      ]).then(([sedesData, sociosData]) => {
        const sedesList = Array.isArray(sedesData) ? sedesData : sedesData?.content || [];
        let sociosList = Array.isArray(sociosData) ? sociosData : sociosData?.content || [];

        if (
          socioPreseleccionado?.id &&
          !sociosList.some((s) => Number(s.id) === Number(socioPreseleccionado.id))
        ) {
          sociosList = [socioPreseleccionado, ...sociosList];
        }

        setSedes(sedesList);
        setSocios(sociosList);

        const defaultSedeId =
          sedeTurno && sedesList.some((s) => s.id === sedeTurno.id)
            ? sedeTurno.id
            : sedesList?.[0]?.id ?? "";

        if (socioPreseleccionado) {
          setModoCliente("SOCIO_EXISTENTE");
          setSocioElegidoId(String(socioPreseleccionado.id));
          setForm((prev) => ({
            ...prev,
            sedeId: defaultSedeId,
            visitanteNombre: `${socioPreseleccionado.nombre || ""} ${socioPreseleccionado.apellido || ""}`.trim(),
            visitanteDocumento: socioPreseleccionado.dni || "",
            fechaAcceso: getLocalToday(),
          }));
        } else if (sociosList.length > 0) {
          setModoCliente("SOCIO_EXISTENTE");
          const first = sociosList[0];
          setSocioElegidoId(String(first.id));
          setForm((prev) => ({
            ...prev,
            sedeId: defaultSedeId,
            visitanteNombre: `${first.nombre || ""} ${first.apellido || ""}`.trim(),
            visitanteDocumento: first.dni || "",
            fechaAcceso: getLocalToday(),
          }));
        } else {
          setModoCliente("VISITANTE_EXTERNO");
          setSocioElegidoId("");
          setForm((prev) => ({
            ...prev,
            sedeId: defaultSedeId,
            visitanteNombre: "",
            visitanteDocumento: "",
            fechaAcceso: getLocalToday(),
          }));
        }
      });
      setBusquedaSocio("");
      setErrorMsg("");
    }
  }, [isOpen, socioPreseleccionado, sedeTurno]);

  const sociosFiltrados = useMemo(() => {
    if (!busquedaSocio.trim()) return socios;
    const q = busquedaSocio.toLowerCase().trim();
    return socios.filter(
      (s) =>
        s.dni?.toLowerCase().includes(q) ||
        s.nombre?.toLowerCase().includes(q) ||
        s.apellido?.toLowerCase().includes(q)
    );
  }, [socios, busquedaSocio]);

  const socioSeleccionadoObj = useMemo(() => {
    if (!socioElegidoId) return null;
    return socios.find((s) => String(s.id) === String(socioElegidoId)) || null;
  }, [socios, socioElegidoId]);

  const handleSelectSocioExistente = (idStr) => {
    setSocioElegidoId(idStr);
    const encontrado = socios.find((s) => String(s.id) === String(idStr));
    if (encontrado) {
      setForm((prev) => ({
        ...prev,
        visitanteNombre: `${encontrado.nombre || ""} ${encontrado.apellido || ""}`.trim(),
        visitanteDocumento: encontrado.dni || "",
      }));
    }
  };

  const handleSwitchModo = (nuevoModo) => {
    setModoCliente(nuevoModo);
    setErrorMsg("");
    if (nuevoModo === "SOCIO_EXISTENTE") {
      const target =
        socios.find((s) => String(s.id) === String(socioElegidoId)) || socios[0];
      if (target) {
        setSocioElegidoId(String(target.id));
        setForm((prev) => ({
          ...prev,
          visitanteNombre: `${target.nombre || ""} ${target.apellido || ""}`.trim(),
          visitanteDocumento: target.dni || "",
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        visitanteNombre: "",
        visitanteDocumento: "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "visitanteDocumento") {
      const cleanDni = value.replace(/\D/g, "").slice(0, 8);
      setForm((prev) => ({ ...prev, visitanteDocumento: cleanDni }));

      // Si escribe un DNI de 8 dígitos en modo visitante externo y ya existe en la BD, autocompletar su nombre
      if (cleanDni.length === 8) {
        const match = socios.find((s) => s.dni === cleanDni);
        if (match) {
          setForm((prev) => ({
            ...prev,
            visitanteDocumento: cleanDni,
            visitanteNombre: `${match.nombre || ""} ${match.apellido || ""}`.trim(),
          }));
        }
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const socioCoincidentePorDni = useMemo(() => {
    if (modoCliente !== "VISITANTE_EXTERNO") return null;
    if (!form.visitanteDocumento || form.visitanteDocumento.length < 8) return null;
    return socios.find((s) => s.dni === form.visitanteDocumento) || null;
  }, [modoCliente, form.visitanteDocumento, socios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.sedeId) {
      setErrorMsg("Debes seleccionar una sede válida.");
      return;
    }
    if (!form.visitanteNombre.trim()) {
      setErrorMsg("El nombre del socio o visitante es obligatorio.");
      return;
    }
    if (!form.monto || Number(form.monto) <= 0) {
      setErrorMsg("El monto debe ser mayor a 0.");
      return;
    }

    setLoading(true);
    try {
      await pagosService.registrarPaseDiario({
        sedeId: Number(form.sedeId),
        visitanteNombre: form.visitanteNombre.trim(),
        visitanteDocumento: form.visitanteDocumento.trim() || null,
        fechaAcceso: form.fechaAcceso || null,
        monto: Number(form.monto),
        metodoPago: form.metodoPago,
        numeroOperacion: form.numeroOperacion.trim() || null,
      });

      showToast("Pase diario registrado correctamente", "success");
      onSuccess();
    } catch (err) {
      setErrorMsg(err.message || "Error al registrar el pase diario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cobro de Pase Diario (Acceso por 1 Día)"
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
            {loading ? "Procesando cobro..." : "Confirmar y Cobrar Pase"}
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

        {/* SELECTOR DE MODO: SOCIO YA REGISTRADO VS VISITANTE NUEVO */}
        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label">Tipo de Asistente</label>
          <div className="nav-pills" style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button
              type="button"
              className={`nav-pill ${modoCliente === "SOCIO_EXISTENTE" ? "active" : ""}`}
              style={{ justifyContent: "center" }}
              onClick={() => handleSwitchModo("SOCIO_EXISTENTE")}
            >
              <Users size={15} />
              Socio ya registrado ({socios.length})
            </button>
            <button
              type="button"
              className={`nav-pill ${modoCliente === "VISITANTE_EXTERNO" ? "active" : ""}`}
              style={{ justifyContent: "center" }}
              onClick={() => handleSwitchModo("VISITANTE_EXTERNO")}
            >
              <UserPlus size={15} />
              Visitante externo / Nuevo
            </button>
          </div>
        </div>

        {/* MODO 1: SELECCIONAR SOCIO YA REGISTRADO EN LA BD (CON O SIN MEMBRESÍA VENCIDA) */}
        {modoCliente === "SOCIO_EXISTENTE" ? (
          <div
            style={{
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
              marginBottom: "16px",
            }}
          >
            <div className="form-group" style={{ marginBottom: "10px" }}>
              <label className="form-label" style={{ fontSize: "12px" }}>
                Buscar socio en la base de datos (por DNI o nombre)
              </label>
              <div className="search-input-wrapper">
                <Search size={15} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Escribe DNI o nombre para filtrar..."
                  value={busquedaSocio}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBusquedaSocio(val);
                    const q = val.toLowerCase().trim();
                    const firstMatch = socios.find(
                      (s) =>
                        s.dni?.toLowerCase().includes(q) ||
                        s.nombre?.toLowerCase().includes(q) ||
                        s.apellido?.toLowerCase().includes(q)
                    );
                    if (firstMatch) {
                      handleSelectSocioExistente(String(firstMatch.id));
                    }
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: socioSeleccionadoObj ? "10px" : 0 }}>
              <label className="form-label" style={{ fontSize: "12px" }}>
                Seleccionar Socio *
              </label>
              <select
                className="form-control"
                value={socioElegidoId}
                onChange={(e) => handleSelectSocioExistente(e.target.value)}
                required
              >
                {sociosFiltrados.length === 0 ? (
                  <option value="">No se encontraron socios con ese criterio</option>
                ) : (
                  sociosFiltrados.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.apellido || ""} — DNI: {s.dni} ({s.activo ? "Con membresía activa" : "Sin membresía / Vencido"})
                    </option>
                  ))
                )}
              </select>
            </div>

            {socioSeleccionadoObj && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "8px",
                  borderTop: "1px solid var(--border-light)",
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span>
                  Cliente: <strong style={{ color: "var(--text-main)" }}>{form.visitanteNombre}</strong> · DNI:{" "}
                  <strong>{form.visitanteDocumento}</strong>
                </span>
                <span className={`badge ${socioSeleccionadoObj.activo ? "badge-success" : "badge-warning"}`}>
                  {socioSeleccionadoObj.activo ? "Membresía Activa" : "Inactivo / Membresía Vencida"}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* MODO 2: VISITANTE EXTERNO O NUEVO */
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">DNI / Documento (8 dígitos)</label>
                <input
                  type="text"
                  name="visitanteDocumento"
                  maxLength={8}
                  value={form.visitanteDocumento}
                  onChange={handleChange}
                  placeholder="Ej. 74859612"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre Completo del Visitante *</label>
                <input
                  type="text"
                  name="visitanteNombre"
                  value={form.visitanteNombre}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                  className="form-control"
                  required
                />
              </div>
            </div>

            {socioCoincidentePorDni && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--color-success-bg)",
                  border: "1px solid var(--color-success-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12.5px",
                  color: "var(--text-main)",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} style={{ color: "var(--color-success)", flexShrink: 0 }} />
                <span>
                  Este DNI ya pertenece al socio registrado{" "}
                  <strong>
                    {socioCoincidentePorDni.nombre} {socioCoincidentePorDni.apellido || ""}
                  </strong>
                  . Se han completado sus datos automáticamente.
                </span>
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <label className="form-label">Sede de Ingreso *</label>
          <select
            name="sedeId"
            value={form.sedeId}
            onChange={handleChange}
            className="form-control"
            required
          >
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.codigo})
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monto a Cobrar (S/) *</label>
            <input
              type="number"
              step="0.50"
              name="monto"
              value={form.monto}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Método de Pago *</label>
            <select
              name="metodoPago"
              value={form.metodoPago}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="YAPE">Yape</option>
              <option value="PLIN">Plin</option>
              <option value="TARJETA">Tarjeta (POS)</option>
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">N° Operación / Referencia</label>
            <input
              type="text"
              name="numeroOperacion"
              value={form.numeroOperacion}
              onChange={handleChange}
              placeholder="Ej. Op. 483921 (opcional)"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de Acceso</label>
            <input
              type="date"
              name="fechaAcceso"
              value={form.fechaAcceso}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default FormularioPaseDiarioModal;
