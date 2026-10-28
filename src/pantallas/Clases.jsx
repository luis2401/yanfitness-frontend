import React, { useState, useEffect } from "react";
import {
  clasesService,
  sedesService,
  empleadosService,
  sociosService,
  inscripcionesService,
  suscripcionesService,
} from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import {
  Calendar,
  Clock,
  Plus,
  Users,
  UserCheck,
  Edit2,
  Power,
  RefreshCw,
  Building2,
  CheckCircle,
} from "lucide-react";

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const Clases = () => {
  const { isAdmin, showToast } = useAuth();
  const [clases, setClases] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Create / Edit Class
  const [modalClaseOpen, setModalClaseOpen] = useState(false);
  const [claseAEditar, setClaseAEditar] = useState(null);
  const [savingClase, setSavingClase] = useState(false);
  const [errorClase, setErrorClase] = useState("");

  const [formClase, setFormClase] = useState({
    nombre: "",
    diaSemana: 1, // 1 = Lunes
    horaInicio: "08:00",
    horaFin: "09:00",
    cupoMax: 20,
    instructorId: "",
    sedeId: "",
  });

  // Modal Enroll Member
  const [modalInscribirOpen, setModalInscribirOpen] = useState(false);
  const [claseParaInscribir, setClaseParaInscribir] = useState(null);
  const [socios, setSocios] = useState([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState("");
  const [savingInscripcion, setSavingInscripcion] = useState(false);
  const [inscritosEnClaseActual, setInscritosEnClaseActual] = useState([]);
  const [suscripcionesActivas, setSuscripcionesActivas] = useState([]);
  const [avisoInscripcion, setAvisoInscripcion] = useState("");

  // Modal Attendees & Attendance
  const [modalAsistenciaOpen, setModalAsistenciaOpen] = useState(false);
  const [claseParaAsistencia, setClaseParaAsistencia] = useState(null);
  const [inscritosClase, setInscritosClase] = useState([]);
  const [loadingInscritos, setLoadingInscritos] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [clasesData, sedesData, instructoresData] = await Promise.all([
        clasesService.listar().catch(() => []),
        sedesService.listar(true).catch(() => []),
        empleadosService.obtenerInstructores().catch(() => []),
      ]);
      setClases(Array.isArray(clasesData) ? clasesData : clasesData?.content || []);
      setSedes(Array.isArray(sedesData) ? sedesData : sedesData?.content || []);
      setInstructores(Array.isArray(instructoresData) ? instructoresData : instructoresData?.content || []);
    } catch (err) {
      showToast(err.message || "Error al cargar clases", "error");
      setClases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleOpenClaseModal = (clase = null) => {
    setClaseAEditar(clase);
    if (clase) {
      setFormClase({
        nombre: clase.nombre || "",
        diaSemana: clase.diaSemana || 1,
        horaInicio: clase.horaInicio || "08:00",
        horaFin: clase.horaFin || "09:00",
        cupoMax: clase.cupoMax || 20,
        instructorId: clase.instructorId || instructores[0]?.id || "",
        sedeId: clase.sedeId || sedes[0]?.id || "",
      });
    } else {
      setFormClase({
        nombre: "",
        diaSemana: 1,
        horaInicio: "08:00",
        horaFin: "09:00",
        cupoMax: 20,
        instructorId: instructores[0]?.id || "",
        sedeId: sedes[0]?.id || "",
      });
    }
    setErrorClase("");
    setModalClaseOpen(true);
  };

  const handleSaveClase = async (e) => {
    e.preventDefault();
    setErrorClase("");

    if (!formClase.nombre.trim()) {
      setErrorClase("El nombre de la clase es obligatorio.");
      return;
    }
    if (!formClase.sedeId) {
      setErrorClase("Debes seleccionar una sede para la clase.");
      return;
    }
    if (!formClase.instructorId) {
      setErrorClase("Debes asignar un instructor a la clase.");
      return;
    }
    if (!formClase.cupoMax || Number(formClase.cupoMax) <= 0) {
      setErrorClase("El cupo máximo debe ser un número mayor a 0.");
      return;
    }
    if (formClase.horaInicio && formClase.horaFin && formClase.horaFin <= formClase.horaInicio) {
      setErrorClase("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setSavingClase(true);
    try {
      if (claseAEditar) {
        await clasesService.actualizar(claseAEditar.id, {
          nombre: formClase.nombre.trim(),
          diaSemana: Number(formClase.diaSemana),
          horaInicio: formClase.horaInicio,
          horaFin: formClase.horaFin,
          cupoMax: Number(formClase.cupoMax),
          instructorId: Number(formClase.instructorId),
          sedeId: Number(formClase.sedeId),
        });
        showToast("Clase actualizada correctamente", "success");
      } else {
        await clasesService.crear({
          nombre: formClase.nombre.trim(),
          diaSemana: Number(formClase.diaSemana),
          horaInicio: formClase.horaInicio,
          horaFin: formClase.horaFin,
          cupoMax: Number(formClase.cupoMax),
          instructorId: Number(formClase.instructorId),
          sedeId: Number(formClase.sedeId),
        });
        showToast("Clase creada exitosamente", "success");
      }
      setModalClaseOpen(false);
      cargarDatos();
    } catch (err) {
      setErrorClase(err.message || "Error al guardar la clase.");
    } finally {
      setSavingClase(false);
    }
  };

  const handleToggleEstado = async (clase) => {
    try {
      await clasesService.cambiarEstado(clase.id, !clase.activo);
      showToast(`Clase ${!clase.activo ? "activada" : "desactivada"}`, "success");
      cargarDatos();
    } catch (err) {
      showToast(err.message || "No se pudo cambiar el estado", "error");
    }
  };

  // Enroll Socio
  const handleOpenInscribir = async (clase) => {
    setClaseParaInscribir(clase);
    setAvisoInscripcion("");
    try {
      const [sociosData, inscritosData, subsData] = await Promise.all([
        sociosService.listar().catch(() => []),
        clasesService.obtenerInscripciones(clase.id, true).catch(() => []),
        suscripcionesService.listar({ estado: "ACTIVA" }).catch(() => []),
      ]);
      const lista = Array.isArray(sociosData) ? sociosData : sociosData?.content || [];
      const inscritos = Array.isArray(inscritosData) ? inscritosData : [];
      const subs = Array.isArray(subsData) ? subsData : subsData?.content || [];

      setInscritosEnClaseActual(inscritos);
      setSuscripcionesActivas(subs);

      const activos = lista.filter((s) => s.activo);
      const mostrar = activos.length > 0 ? activos : lista;
      setSocios(mostrar);

      // Seleccionar por defecto al primer socio elegible que aún no esté inscrito
      const elegible = mostrar.find(
        (s) => !inscritos.some((i) => Number(i.socioId) === Number(s.id))
      );
      setSocioSeleccionado((elegible || mostrar?.[0])?.id || "");
    } catch {
      setSocios([]);
    }
    setModalInscribirOpen(true);
  };

  const evaluarElegibilidadSocioEnClase = (socioIdVal) => {
    if (!claseParaInscribir || !socioIdVal) return { ok: true, msg: "" };
    const idNum = Number(socioIdVal);
    if (inscritosEnClaseActual.some((i) => Number(i.socioId) === idNum)) {
      return {
        ok: false,
        yaInscrito: true,
        msg: "Este socio ya se encuentra inscrito actualmente en esta clase.",
      };
    }
    const subsDelSocio = suscripcionesActivas.filter(
      (s) => Number(s.socioId || s.socio?.id) === idNum && s.estado === "ACTIVA"
    );
    if (subsDelSocio.length === 0) {
      return {
        ok: false,
        msg: "Este socio no cuenta con una membresía activa vigente. Actívale un plan desde el módulo de Membresías o Socios antes de inscribirlo.",
      };
    }
    const cubreSede = subsDelSocio.some(
      (s) =>
        Boolean(s.accesoMultisede) ||
        Number(s.sedeId || s.sedeInscripcion?.id) === Number(claseParaInscribir.sedeId) ||
        (s.sedeNombre &&
          claseParaInscribir.sedeNombre &&
          s.sedeNombre.toLowerCase() === claseParaInscribir.sedeNombre.toLowerCase())
    );
    if (!cubreSede) {
      const sedeSocio = subsDelSocio[0]?.sedeNombre || "otra sede";
      return {
        ok: false,
        msg: `La membresía actual de este socio pertenece a ${sedeSocio} (sin acceso Multisede) y esta clase se dicta en ${
          claseParaInscribir.sedeNombre || "esta sede"
        }.`,
      };
    }
    return { ok: true, msg: "" };
  };

  const handleInscribirSocio = async (e) => {
    e.preventDefault();
    if (!claseParaInscribir || !socioSeleccionado) return;
    setAvisoInscripcion("");

    const check = evaluarElegibilidadSocioEnClase(socioSeleccionado);
    if (!check.ok) {
      if (check.yaInscrito) {
        showToast("El socio ya forma parte de la lista de inscritos de esta clase.", "info");
        setModalInscribirOpen(false);
        return;
      }
      setAvisoInscripcion(check.msg);
      return;
    }

    setSavingInscripcion(true);
    try {
      await inscripcionesService.inscribir(
        Number(socioSeleccionado),
        claseParaInscribir.id
      );
      showToast("Socio inscrito exitosamente en la clase", "success");
      setModalInscribirOpen(false);
      cargarDatos();
    } catch (err) {
      setAvisoInscripcion(err.message || "No se pudo completar la inscripción en la clase.");
    } finally {
      setSavingInscripcion(false);
    }
  };

  // View Enrolled & Register Attendance
  const handleOpenAsistencia = async (clase) => {
    setClaseParaAsistencia(clase);
    setLoadingInscritos(true);
    setModalAsistenciaOpen(true);
    try {
      const data = await clasesService.obtenerInscripciones(clase.id, true);
      setInscritosClase(Array.isArray(data) ? data : []);
    } catch {
      setInscritosClase([]);
    } finally {
      setLoadingInscritos(false);
    }
  };

  const handleRegistrarAsistencia = async (inscripcionId, estado) => {
    try {
      const d = new Date();
      const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      await inscripcionesService.registrarAsistencia({
        socioClaseId: inscripcionId,
        fecha: localToday,
        estado,
        observacion: `Marcado desde panel por ${claseParaAsistencia?.nombre}`,
      });
      showToast(`Asistencia registrada: ${estado}`, "success");
    } catch (err) {
      showToast(err.message || "Error al registrar asistencia", "error");
    }
  };

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar size={22} style={{ color: "var(--color-brand-primary)" }} />
              Clases Grupales y Actividades
            </h2>
            <p>Programación semanal, control de aforos, cupos e inscripciones</p>
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
                onClick={() => handleOpenClaseModal(null)}
              >
                <Plus size={16} />
                Nueva Clase
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CLASSES LIST */}
      {loading ? (
        <LoadingSpinner text="Cargando programación de clases..." />
      ) : clases.length === 0 ? (
        <EmptyState
          title="No hay clases programadas"
          description="Crea sesiones de entrenamiento grupal (Spinning, Yoga, Crossfit, etc.)."
          actionLabel={isAdmin ? "Programar Primera Clase" : null}
          onAction={isAdmin ? () => handleOpenClaseModal(null) : null}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {clases.map((clase) => {
            const nombreDia = DIAS_SEMANA[(clase.diaSemana || 1) - 1] || "Lunes";
            const porcentajeOcupacion = Math.min(
              100,
              Math.round(((clase.inscritos || 0) / (clase.cupoMax || 1)) * 100)
            );

            return (
              <div
                key={clase.id}
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
                        background: "var(--color-purple-bg)",
                        color: "var(--color-purple)",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-full)",
                        textTransform: "uppercase",
                      }}
                    >
                      {nombreDia}
                    </span>
                    <Badge status={clase.activo} />
                  </div>

                  <h3 style={{ margin: "0 0 8px 0", fontSize: "19px", fontWeight: 800, color: "var(--text-main)" }}>
                    {clase.nombre}
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Clock size={15} style={{ color: "var(--color-brand-primary)" }} />
                      <strong>
                        {clase.horaInicio} - {clase.horaFin}
                      </strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <UserCheck size={15} style={{ color: "var(--color-success)" }} />
                      <span>
                        Instructor: <strong>{clase.instructorNombre || "Por asignar"}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Building2 size={15} style={{ color: "var(--color-accent)" }} />
                      <span>
                        Sede: <strong>{clase.sedeNombre || "General"}</strong>
                      </span>
                    </div>
                  </div>

                  {/* CAPACITY PROGRESS */}
                  <div
                    style={{
                      background: "var(--bg-surface-elevated, #162032)",
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-light)",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        Cupos Disponibles:
                      </span>
                      <strong>
                        {clase.inscritos || 0} / {clase.cupoMax} alumnos
                      </strong>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "7px",
                        background: "var(--border-light)",
                        borderRadius: "var(--radius-full)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${porcentajeOcupacion}%`,
                          height: "100%",
                          background:
                            porcentajeOcupacion >= 90
                              ? "var(--color-danger)"
                              : porcentajeOcupacion >= 70
                              ? "var(--color-warning)"
                              : "var(--color-brand-primary)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
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
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenInscribir(clase)}
                      disabled={!clase.activo || (clase.inscritos || 0) >= (clase.cupoMax || 0)}
                    >
                      <Users size={14} />
                      Inscribir
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenAsistencia(clase)}
                    >
                      <CheckCircle size={14} />
                      Asistencia
                    </button>
                  </div>

                  {isAdmin && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenClaseModal(clase)}
                        title="Editar clase"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: clase.activo ? "var(--color-warning)" : "var(--color-success)" }}
                        onClick={() => handleToggleEstado(clase)}
                        title="Activar / Desactivar"
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CLASS MODAL */}
      {modalClaseOpen && (
        <Modal
          isOpen={modalClaseOpen}
          onClose={() => setModalClaseOpen(false)}
          title={claseAEditar ? `Editar Clase: ${claseAEditar.nombre}` : "Programar Nueva Clase"}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalClaseOpen(false)}
                disabled={savingClase}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveClase}
                disabled={savingClase}
              >
                {savingClase ? "Guardando..." : claseAEditar ? "Guardar Cambios" : "Programar Clase"}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveClase}>
            {errorClase && (
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
                {errorClase}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nombre de la Actividad / Disciplina *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Spinning Matutino, Crossfit Funcional..."
                value={formClase.nombre}
                onChange={(e) => setFormClase({ ...formClase, nombre: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Día de la Semana *</label>
                <select
                  className="form-control"
                  value={formClase.diaSemana}
                  onChange={(e) => setFormClase({ ...formClase, diaSemana: e.target.value })}
                  required
                >
                  {DIAS_SEMANA.map((dia, idx) => (
                    <option key={dia} value={idx + 1}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cupo Máximo de Alumnos *</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={formClase.cupoMax}
                  onChange={(e) => setFormClase({ ...formClase, cupoMax: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hora Inicio *</label>
                <input
                  type="time"
                  className="form-control"
                  value={formClase.horaInicio}
                  onChange={(e) => setFormClase({ ...formClase, horaInicio: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora Fin *</label>
                <input
                  type="time"
                  className="form-control"
                  value={formClase.horaFin}
                  onChange={(e) => setFormClase({ ...formClase, horaFin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Instructor Asignado *</label>
                <select
                  className="form-control"
                  value={formClase.instructorId}
                  onChange={(e) => setFormClase({ ...formClase, instructorId: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar instructor --</option>
                  {instructores.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nombre} {ins.apellido} ({ins.especialidad || "Entrenador"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sede *</label>
                <select
                  className="form-control"
                  value={formClase.sedeId}
                  onChange={(e) => setFormClase({ ...formClase, sedeId: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar sede --</option>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ENROLL MODAL */}
      {modalInscribirOpen && claseParaInscribir && (
        <Modal
          isOpen={modalInscribirOpen}
          onClose={() => setModalInscribirOpen(false)}
          title={`Inscribir Socio en: ${claseParaInscribir.nombre}`}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalInscribirOpen(false)}
                disabled={savingInscripcion}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInscribirSocio}
                disabled={savingInscripcion}
              >
                {savingInscripcion ? "Inscribiendo..." : "Confirmar Inscripción"}
              </button>
            </>
          }
        >
          <form onSubmit={handleInscribirSocio}>
            {avisoInscripcion && (
              <div className="notice-box notice-box-warning">
                <span>ℹ️</span>
                <span>{avisoInscripcion}</span>
              </div>
            )}

            <div style={{ marginBottom: "16px", fontSize: "13.5px" }}>
              Clase: <strong>{claseParaInscribir.nombre}</strong> (
              {DIAS_SEMANA[(claseParaInscribir.diaSemana || 1) - 1]} {claseParaInscribir.horaInicio} a{" "}
              {claseParaInscribir.horaFin}) • Sede:{" "}
              <strong>{claseParaInscribir.sedeNombre || "Principal"}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Seleccionar Socio *</label>
              <select
                className="form-control"
                value={socioSeleccionado}
                onChange={(e) => {
                  setSocioSeleccionado(e.target.value);
                  const chk = evaluarElegibilidadSocioEnClase(e.target.value);
                  setAvisoInscripcion(chk.ok ? "" : chk.msg);
                }}
                required
              >
                {socios.map((s) => {
                  const yaEsta = inscritosEnClaseActual.some(
                    (i) => Number(i.socioId) === Number(s.id)
                  );
                  return (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.apellido || ""} (DNI: {s.dni})
                      {yaEsta ? " — Ya inscrito en esta clase" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* ATTENDANCE MODAL */}
      {modalAsistenciaOpen && claseParaAsistencia && (
        <Modal
          isOpen={modalAsistenciaOpen}
          onClose={() => setModalAsistenciaOpen(false)}
          title={`Lista de Asistencia: ${claseParaAsistencia.nombre}`}
          size="lg"
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalAsistenciaOpen(false)}
            >
              Cerrar
            </button>
          }
        >
          <div>
            <div style={{ marginBottom: "14px", fontSize: "13px", color: "var(--text-muted)" }}>
              Marca la asistencia de los socios inscritos para la sesión de hoy.
            </div>

            {loadingInscritos ? (
              <LoadingSpinner text="Consultando inscritos..." />
            ) : inscritosClase.length === 0 ? (
              <p style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                No hay socios inscritos en esta clase aún.
              </p>
            ) : (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>DNI</th>
                    <th>Estado Inscripción</th>
                    <th style={{ textAlign: "right" }}>Marcar Asistencia Hoy</th>
                  </tr>
                </thead>
                <tbody>
                  {inscritosClase.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.socioNombre}</strong></td>
                      <td>{item.socioDni || "—"}</td>
                      <td>
                        <Badge status={(item.activo ?? item.activa) ? "ACTIVA" : "INACTIVA"} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={() => handleRegistrarAsistencia(item.id, "ASISTIO")}
                            title="Presente"
                          >
                            Presente
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRegistrarAsistencia(item.id, "FALTO")}
                            title="Falta"
                          >
                            Falta
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRegistrarAsistencia(item.id, "JUSTIFICADO")}
                            title="Justificada"
                          >
                            Justif.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Clases;
