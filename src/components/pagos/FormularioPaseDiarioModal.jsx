import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { sedesService, pagosService } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const FormularioPaseDiarioModal = ({ isOpen, onClose, onSuccess }) => {
  const { showToast, sedeTurno } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    sedeId: "",
    visitanteNombre: "",
    visitanteDocumento: "",
    fechaAcceso: new Date().toISOString().split("T")[0],
    monto: "20.00",
    metodoPago: "EFECTIVO",
    numeroOperacion: "",
  });

  useEffect(() => {
    if (isOpen) {
      sedesService
        .listar(true)
        .then((data) => {
          setSedes(data || []);
          if (data && data.length > 0) {
            setForm((prev) => ({ ...prev, sedeId: sedeTurno?.id || data[0].id }));
          }
        })
        .catch(() => {});
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.sedeId) {
      setErrorMsg("Debes seleccionar una sede válida.");
      return;
    }
    if (!form.visitanteNombre.trim()) {
      setErrorMsg("El nombre del visitante es obligatorio.");
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
      title="Cobro de Pase Diario (Acceso por Día)"
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
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Procesando cobro..." : "Confirmar y Cobrar"}
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
            <label className="form-label">Nombre del Visitante *</label>
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

          <div className="form-group">
            <label className="form-label">DNI / Documento</label>
            <input
              type="text"
              name="visitanteDocumento"
              value={form.visitanteDocumento}
              onChange={handleChange}
              placeholder="87654321"
              className="form-control"
            />
          </div>
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
