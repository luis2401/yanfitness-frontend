import React, { useState, useEffect, useMemo } from "react";
import Modal from "../common/Modal";
import { sociosService } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const FormularioSocioModal = ({
  isOpen,
  onClose,
  socioAEditar = null,
  onSuccess,
}) => {
  const { showToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [sociosPadron, setSociosPadron] = useState([]);

  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    activo: true,
  });

  useEffect(() => {
    if (isOpen) {
      sociosService
        .listar()
        .then((data) => {
          setSociosPadron(Array.isArray(data) ? data : data?.content || []);
        })
        .catch(() => setSociosPadron([]));
    }
    if (socioAEditar) {
      setForm({
        dni: socioAEditar.dni || "",
        nombre: socioAEditar.nombre || "",
        apellido: socioAEditar.apellido || "",
        telefono: socioAEditar.telefono || "",
        correo: socioAEditar.correo || "",
        activo: socioAEditar.activo !== undefined ? socioAEditar.activo : true,
      });
    } else {
      setForm({
        dni: "",
        nombre: "",
        apellido: "",
        telefono: "",
        correo: "",
        activo: false, // Inactivo por defecto hasta que adquiera su membresía
      });
    }
    setErrorMsg("");
    setFieldErrors({});
  }, [socioAEditar, isOpen]);

  // Detectar si el DNI ingresado ya pertenece a un socio en el directorio
  const socioExistentePorDni = useMemo(() => {
    if (socioAEditar) return null;
    const dniLimpio = (form.dni || "").trim();
    if (dniLimpio.length !== 8) return null;
    return sociosPadron.find((s) => s.dni === dniLimpio) || null;
  }, [form.dni, sociosPadron, socioAEditar]);

  // Validaciones individuales de campo
  const validarCampo = (name, value) => {
    let error = "";
    const val = (value || "").trim();

    if (name === "dni") {
      if (!socioAEditar) {
        if (!val) {
          error = "El DNI es obligatorio.";
        } else if (!/^\d{8}$/.test(val)) {
          error = "El DNI debe tener exactamente 8 dígitos numéricos.";
        }
      }
    } else if (name === "nombre") {
      if (!val) {
        error = "El nombre es obligatorio.";
      } else if (val.length < 2) {
        error = "El nombre debe tener al menos 2 caracteres.";
      }
    } else if (name === "apellido") {
      if (!val) {
        error = "El apellido es obligatorio.";
      } else if (val.length < 2) {
        error = "El apellido debe tener al menos 2 caracteres.";
      }
    } else if (name === "telefono") {
      if (!val) {
        error = "El teléfono de contacto es obligatorio (9 dígitos).";
      } else if (!/^\d{9}$/.test(val)) {
        error = "El teléfono debe tener exactamente 9 dígitos numéricos (ej. 987654321).";
      }
    } else if (name === "correo") {
      if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
        error = "El correo debe tener el formato usuario@correo.com";
      } else if (
        val &&
        sociosPadron.some(
          (s) =>
            s.correo &&
            s.correo.trim().toLowerCase() === val.toLowerCase() &&
            (!socioAEditar || Number(s.id) !== Number(socioAEditar.id))
        )
      ) {
        error = "Este correo electrónico ya se encuentra vinculado a otro socio.";
      }
    }

    setFieldErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (name === "dni") {
      finalValue = value.replace(/\D/g, "").slice(0, 8);
    } else if (name === "telefono") {
      finalValue = value.replace(/\D/g, "").slice(0, 9);
    }

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (fieldErrors[name]) {
      validarCampo(name, finalValue);
    }
    if (errorMsg) {
      setErrorMsg("");
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validarCampo(name, value);
  };

  const validarTodoElFormulario = () => {
    const errors = {};

    if (!socioAEditar) {
      if (!form.dni.trim()) {
        errors.dni = "El DNI es obligatorio.";
      } else if (!/^\d{8}$/.test(form.dni.trim())) {
        errors.dni = "El DNI debe tener exactamente 8 dígitos numéricos.";
      }
    }

    if (!form.nombre.trim()) {
      errors.nombre = "El nombre es obligatorio.";
    } else if (form.nombre.trim().length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres.";
    }

    if (!form.apellido.trim()) {
      errors.apellido = "El apellido es obligatorio.";
    } else if (form.apellido.trim().length < 2) {
      errors.apellido = "El apellido debe tener al menos 2 caracteres.";
    }

    if (!form.telefono.trim()) {
      errors.telefono = "El teléfono es obligatorio (9 dígitos).";
    } else if (!/^\d{9}$/.test(form.telefono.trim())) {
      errors.telefono = "El teléfono debe tener exactamente 9 dígitos numéricos.";
    }

    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.correo.trim())) {
      errors.correo = "El correo electrónico debe tener el formato usuario@dominio.com.";
    } else if (
      form.correo &&
      sociosPadron.some(
        (s) =>
          s.correo &&
          s.correo.trim().toLowerCase() === form.correo.trim().toLowerCase() &&
          (!socioAEditar || Number(s.id) !== Number(socioAEditar.id))
      )
    ) {
      errors.correo = "Este correo electrónico ya está registrado en otro socio.";
    }

    setFieldErrors(errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");

    // Si el DNI ya existe en el directorio, pasamos directamente a la venta/renovación con ese socio
    if (socioExistentePorDni) {
      showToast(
        `Socio ${socioExistentePorDni.nombre} ${socioExistentePorDni.apellido || ""} seleccionado del registro.`,
        "info"
      );
      onSuccess(socioExistentePorDni);
      return;
    }

    const errors = validarTodoElFormulario();
    if (Object.keys(errors).length > 0) {
      const firstErr = Object.values(errors)[0];
      setErrorMsg(firstErr || "Revisa los campos señalados antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      if (socioAEditar) {
        const actualizado = await sociosService.actualizar(socioAEditar.id, {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          correo: form.correo?.trim() || null,
          telefono: form.telefono.trim(),
        });
        showToast("Datos del socio actualizados correctamente", "success");
        onSuccess(actualizado);
      } else {
        const nuevo = await sociosService.crear({
          dni: form.dni.trim(),
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          telefono: form.telefono.trim(),
          correo: form.correo?.trim() || null,
          activo: form.activo,
        });
        showToast(
          "Socio registrado. Selecciona su membresía o pase diario para activarlo.",
          "success"
        );
        onSuccess(nuevo);
      }
    } catch (err) {
      setErrorMsg(err.message || "No se pudo completar el registro del socio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={socioAEditar ? `Editar Socio: ${socioAEditar.nombre}` : "Registrar Nuevo Socio"}
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
            {loading
              ? "Guardando..."
              : socioExistentePorDni
              ? `Continuar a Venta con ${socioExistentePorDni.nombre}`
              : socioAEditar
              ? "Guardar Cambios"
              : "Registrar y Continuar a Venta"}
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

        {socioExistentePorDni && (
          <div className="notice-box notice-box-emerald">
            <span>✨</span>
            <div>
              <div style={{ fontWeight: 600, color: "#6ee7b7", marginBottom: "2px" }}>
                Socio ya registrado en el directorio
              </div>
              <div style={{ fontSize: "12.5px", color: "#d1fae5" }}>
                El DNI <strong>{socioExistentePorDni.dni}</strong> pertenece a{" "}
                <strong>
                  {socioExistentePorDni.nombre} {socioExistentePorDni.apellido || ""}
                </strong>
                . Haz clic en <strong>Continuar a Venta</strong> para asignarle o extenderle su membresía.
              </div>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">DNI (8 dígitos) *</label>
            <input
              type="text"
              name="dni"
              value={form.dni}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={8}
              placeholder="12345678"
              className={`form-control ${fieldErrors.dni ? "is-invalid" : ""}`}
              required
              disabled={Boolean(socioAEditar)}
            />
            {fieldErrors.dni && (
              <span className="field-error-text">ℹ️ {fieldErrors.dni}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono (9 dígitos) *</label>
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={9}
              placeholder="987654321"
              className={`form-control ${fieldErrors.telefono ? "is-invalid" : ""}`}
              required
              disabled={Boolean(socioExistentePorDni)}
            />
            {fieldErrors.telefono && (
              <span className="field-error-text">ℹ️ {fieldErrors.telefono}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nombres *</label>
            <input
              type="text"
              name="nombre"
              value={socioExistentePorDni ? socioExistentePorDni.nombre : form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej. Carlos"
              className={`form-control ${fieldErrors.nombre ? "is-invalid" : ""}`}
              required
              disabled={Boolean(socioExistentePorDni)}
            />
            {fieldErrors.nombre && (
              <span className="field-error-text">ℹ️ {fieldErrors.nombre}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Apellidos *</label>
            <input
              type="text"
              name="apellido"
              value={socioExistentePorDni ? socioExistentePorDni.apellido || "" : form.apellido}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej. Morales Pérez"
              className={`form-control ${fieldErrors.apellido ? "is-invalid" : ""}`}
              required
              disabled={Boolean(socioExistentePorDni)}
            />
            {fieldErrors.apellido && (
              <span className="field-error-text">ℹ️ {fieldErrors.apellido}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Correo Electrónico (Opcional)</label>
          <input
            type="email"
            name="correo"
            value={socioExistentePorDni ? socioExistentePorDni.correo || "" : form.correo}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="carlos.morales@gmail.com"
            className={`form-control ${fieldErrors.correo ? "is-invalid" : ""}`}
            disabled={Boolean(socioExistentePorDni)}
          />
          {fieldErrors.correo && (
            <span className="field-error-text">ℹ️ {fieldErrors.correo}</span>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default FormularioSocioModal;
