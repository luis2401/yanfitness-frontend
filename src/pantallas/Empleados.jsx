import React, { useState, useEffect } from "react";
import { empleadosService, sedesService, asignacionesService } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import {
  Briefcase,
  UserPlus,
  RefreshCw,
  Search,
  Phone,
  Mail,
  Edit2,
  Power,
  Dumbbell,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Shield,
  Layers,
  MapPin,
} from "lucide-react";

const ROLES_DISPONIBLES = [
  { id: 1, nombre: "ADMINISTRADOR", desc: "Acceso total a todos los módulos y sedes" },
  { id: 2, nombre: "SUPERVISOR", desc: "Supervisión operativa y reportes" },
  { id: 3, nombre: "INSTRUCTOR", desc: "Coach deportivo, rutinas y dictado de clases" },
  { id: 4, nombre: "RECEPCIONISTA", desc: "Atención, registro de socios y cobro en caja" },
  { id: 5, nombre: "EMPLEADO", desc: "Personal administrativo general" },
];

const Empleados = () => {
  const { isAdmin, showToast } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("directorio"); // "directorio" | "asignaciones"

  // DIRECTORY STATE
  const [empleados, setEmpleados] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [soloInstructores, setSoloInstructores] = useState(false);

  // MODAL EMPLEADO
  const [modalOpen, setModalOpen] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    rolId: 3, // default Coach / Instructor
    telefono: "",
    correo: "",
    direccion: "",
    especialidad: "Entrenador Personal / Funcional",
  });

  // ASSIGNMENTS & ROTATION STATE
  const [asignaciones, setAsignaciones] = useState([]);
  const [filtroSedeAsignacion, setFiltroSedeAsignacion] = useState("");
  const [filtroEmpleadoAsignacion, setFiltroEmpleadoAsignacion] = useState("");
  const [modalAsignacionOpen, setModalAsignacionOpen] = useState(false);
  const [savingAsignacion, setSavingAsignacion] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState("");

  const [formAsignacion, setFormAsignacion] = useState({
    empleadoId: "",
    sedeId: "",
    fechaDesde: new Date().toISOString().split("T")[0],
    fechaHasta: "",
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [empData, sedesData, asigData] = await Promise.all([
        soloInstructores
          ? empleadosService.obtenerInstructores().catch(() => [])
          : empleadosService.listar().catch(() => []),
        sedesService.listar(true).catch(() => []),
        asignacionesService.listar().catch(() => []),
      ]);

      setEmpleados(Array.isArray(empData) ? empData : empData?.content || []);
      setSedes(Array.isArray(sedesData) ? sedesData : sedesData?.content || []);
      setAsignaciones(Array.isArray(asigData) ? asigData : asigData?.content || []);
    } catch (err) {
      showToast(err.message || "Error al sincronizar datos del personal", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [soloInstructores]);

  // Open Modal Colaborador
  const handleOpenModal = (emp = null) => {
    setEmpleadoAEditar(emp);
    if (emp) {
      setForm({
        dni: emp.dni || "",
        nombre: emp.nombre || "",
        apellido: emp.apellido || "",
        rolId: emp.rol?.id || emp.rolId || 3,
        telefono: emp.telefono || "",
        correo: emp.correo || "",
        direccion: emp.direccion || "",
        especialidad: emp.especialidad || "",
      });
    } else {
      setForm({
        dni: "",
        nombre: "",
        apellido: "",
        rolId: 3,
        telefono: "",
        correo: "",
        direccion: "",
        especialidad: "Coach Deportivo / Musculación",
      });
    }
    setErrorMsg("");
    setModalOpen(true);
  };

  // Submit Colaborador
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!empleadoAEditar && !/^\d{8}$/.test((form.dni || "").trim())) {
      setErrorMsg("El DNI debe tener exactamente 8 dígitos numéricos.");
      return;
    }
    if (!form.nombre.trim()) {
      setErrorMsg("El nombre del colaborador es obligatorio.");
      return;
    }
    if (!form.apellido.trim()) {
      setErrorMsg("El apellido del colaborador es obligatorio.");
      return;
    }
    if (!form.rolId) {
      setErrorMsg("Debes seleccionar un rol para el colaborador.");
      return;
    }
    if (!/^\d{9}$/.test((form.telefono || "").trim())) {
      setErrorMsg("El teléfono debe tener exactamente 9 dígitos numéricos.");
      return;
    }
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.correo.trim())) {
      setErrorMsg("El correo electrónico no tiene un formato válido (ejemplo: usuario@correo.com).");
      return;
    }

    setSaving(true);
    try {
      if (empleadoAEditar) {
        await empleadosService.actualizar(empleadoAEditar.id, {
          nombre: form.nombre,
          apellido: form.apellido,
          rolId: Number(form.rolId),
          telefono: form.telefono,
          correo: form.correo || null,
          direccion: form.direccion || null,
          especialidad: form.especialidad || null,
        });
        showToast("Colaborador actualizado correctamente", "success");
      } else {
        await empleadosService.crear({
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          rolId: Number(form.rolId),
          telefono: form.telefono,
          correo: form.correo || null,
          direccion: form.direccion || null,
          especialidad: form.especialidad || null,
        });
        showToast("Colaborador registrado exitosamente", "success");
      }
      setModalOpen(false);
      cargarDatos();
    } catch (err) {
      setErrorMsg(err.message || "Error al procesar colaborador.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (emp) => {
    try {
      await empleadosService.cambiarEstado(emp.id, !emp.activo);
      showToast(`Estado de ${emp.nombre} actualizado`, "success");
      cargarDatos();
    } catch (err) {
      showToast(err.message || "No se pudo cambiar el estado", "error");
    }
  };

  // OPEN MODAL ASIGNACION
  const handleOpenAsignacionModal = (empDefault = null) => {
    setFormAsignacion({
      empleadoId: empDefault?.id || (empleados[0]?.id ? String(empleados[0].id) : ""),
      sedeId: sedes[0]?.id ? String(sedes[0].id) : "",
      fechaDesde: new Date().toISOString().split("T")[0],
      fechaHasta: "",
    });
    setErrorAsignacion("");
    setModalAsignacionOpen(true);
  };

  // SUBMIT ASIGNACION / ROTACION
  const handleSaveAsignacion = async (e) => {
    e.preventDefault();
    setErrorAsignacion("");

    if (!formAsignacion.empleadoId) {
      setErrorAsignacion("Debes seleccionar un colaborador.");
      return;
    }
    if (!formAsignacion.sedeId) {
      setErrorAsignacion("Debes seleccionar una sede.");
      return;
    }

    setSavingAsignacion(true);
    try {
      await asignacionesService.asignar({
        empleadoId: Number(formAsignacion.empleadoId),
        sedeId: Number(formAsignacion.sedeId),
        fechaDesde: formAsignacion.fechaDesde || null,
        fechaHasta: formAsignacion.fechaHasta || null,
      });

      showToast("Asignación de sede registrada correctamente", "success");
      setModalAsignacionOpen(false);
      cargarDatos();
    } catch (err) {
      setErrorAsignacion(err.message || "Error al asignar colaborador a la sede.");
    } finally {
      setSavingAsignacion(false);
    }
  };

  // FINALIZAR ASIGNACION (TERMINAR ROTACION HOY)
  const handleFinalizarAsignacion = async (id, nombre) => {
    if (!window.confirm(`¿Finalizar la rotación de ${nombre} en esta sede a partir de hoy?`)) return;
    try {
      await asignacionesService.finalizar(id, {
        fechaHasta: new Date().toISOString().split("T")[0],
      });
      showToast("Rotación finalizada con éxito", "success");
      cargarDatos();
    } catch (err) {
      showToast(err.message || "Error al finalizar asignación", "error");
    }
  };

  // ANULAR ASIGNACION
  const handleAnularAsignacion = async (id) => {
    if (!window.confirm("¿Estás seguro de anular esta asignación? Esta acción es irreversible.")) return;
    try {
      await asignacionesService.anular(id);
      showToast("Asignación anulada", "success");
      cargarDatos();
    } catch (err) {
      showToast(err.message || "Error al anular asignación", "error");
    }
  };

  // Filters
  const empleadosFiltrados = empleados.filter((emp) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      emp.dni?.includes(term) ||
      emp.nombre?.toLowerCase().includes(term) ||
      emp.apellido?.toLowerCase().includes(term) ||
      emp.especialidad?.toLowerCase().includes(term)
    );
  });

  const asignacionesFiltradas = asignaciones.filter((asig) => {
    if (filtroSedeAsignacion && String(asig.sedeId) !== String(filtroSedeAsignacion)) {
      return false;
    }
    if (filtroEmpleadoAsignacion && String(asig.empleadoId) !== String(filtroEmpleadoAsignacion)) {
      return false;
    }
    return true;
  });

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card" style={{ marginBottom: "20px", padding: "22px 26px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Briefcase size={22} style={{ color: "var(--color-brand-primary)" }} />
              Coaches & Equipo Operativo
            </h2>
            <p>Directorio de entrenadores, recepcionistas y rotación multisede</p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleOpenAsignacionModal(null)}
                  style={{
                    borderColor: "rgba(0, 210, 255, 0.4)",
                    color: "var(--color-accent)",
                  }}
                >
                  <MapPin size={16} />
                  + Asignar / Rotar Sede
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenModal(null)}
                >
                  <UserPlus size={16} />
                  + Registrar Personal
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="nav-pills" style={{ marginBottom: "22px" }}>
        <button
          type="button"
          className={`nav-pill ${activeSubTab === "directorio" ? "active" : ""}`}
          onClick={() => setActiveSubTab("directorio")}
        >
          <Dumbbell size={16} />
          Directorio del Personal ({empleados.length})
        </button>
        <button
          type="button"
          className={`nav-pill ${activeSubTab === "asignaciones" ? "active" : ""}`}
          onClick={() => setActiveSubTab("asignaciones")}
        >
          <Building2 size={16} />
          Asignaciones y Rotaciones de Sede ({asignaciones.length})
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: DIRECTORIO DEL PERSONAL
          ========================================================================= */}
      {activeSubTab === "directorio" && (
        <>
          {/* FILTER BAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div className="search-bar" style={{ flex: 1, minWidth: "260px", maxWidth: "420px" }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por DNI, nombre o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "var(--text-main)",
                }}
              >
                <input
                  type="checkbox"
                  checked={soloInstructores}
                  onChange={(e) => setSoloInstructores(e.target.checked)}
                />
                Ver sólo Coaches / Instructores
              </label>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner text="Cargando colaboradores..." />
          ) : empleadosFiltrados.length === 0 ? (
            <EmptyState
              title="No se encontraron colaboradores"
              description={searchTerm ? "Intenta con otro término de búsqueda." : "Comienza registrando a tu personal o entrenadores."}
              actionLabel={isAdmin ? "Registrar Primer Colaborador" : null}
              onAction={() => handleOpenModal(null)}
            />
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-light)" }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "220px" }}>Colaborador</th>
                      <th style={{ minWidth: "110px" }}>DNI</th>
                      <th style={{ minWidth: "140px" }}>Rol y Función</th>
                      <th style={{ minWidth: "150px" }}>Especialidad</th>
                      <th style={{ minWidth: "160px" }}>Contacto</th>
                      <th style={{ minWidth: "100px" }}>Estado</th>
                      {isAdmin && <th style={{ minWidth: "130px", textAlign: "right" }}>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {empleadosFiltrados.map((emp) => {
                      const rolNombre =
                        emp.rolNombre ||
                        emp.rol?.nombre ||
                        ROLES_DISPONIBLES.find((r) => r.id === Number(emp.rolId))?.nombre ||
                        "INSTRUCTOR";
                      return (
                        <tr key={emp.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "var(--radius-md)",
                                  background: "rgba(16, 185, 129, 0.15)",
                                  color: "var(--color-brand-primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: "14px",
                                  border: "1px solid rgba(16, 185, 129, 0.3)",
                                }}
                              >
                                {emp.nombre?.charAt(0)}
                                {emp.apellido?.charAt(0)}
                              </div>
                              <div>
                                <strong style={{ color: "var(--text-main)", fontSize: "14px" }}>
                                  {emp.nombre} {emp.apellido}
                                </strong>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                  ID #{emp.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{emp.dni}</span>
                          </td>
                          <td>
                            <Badge
                              variant={
                                rolNombre === "ADMINISTRADOR"
                                  ? "purple"
                                  : rolNombre === "INSTRUCTOR"
                                  ? "success"
                                  : rolNombre === "RECEPCIONISTA"
                                  ? "blue"
                                  : "neutral"
                              }
                            >
                              {rolNombre}
                            </Badge>
                          </td>
                          <td>
                            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                              {emp.especialidad || "General"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "12.5px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Phone size={13} style={{ color: "var(--text-muted)" }} />
                                {emp.telefono}
                              </span>
                              {emp.correo && (
                                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
                                  <Mail size={13} />
                                  {emp.correo}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge variant={emp.activo ? "success" : "danger"}>
                              {emp.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </td>
                          {isAdmin && (
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => handleOpenAsignacionModal(emp)}
                                  title="Asignar o rotar de sede"
                                  style={{ color: "var(--color-accent)" }}
                                >
                                  <MapPin size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => handleOpenModal(emp)}
                                  title="Editar datos del personal"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => handleToggleEstado(emp)}
                                  title={emp.activo ? "Desactivar" : "Activar"}
                                  style={{ color: emp.activo ? "var(--color-danger)" : "var(--color-success)" }}
                                >
                                  <Power size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          SUB-TAB 2: ASIGNACIONES Y ROTACIONES DE SEDE
          ========================================================================= */}
      {activeSubTab === "asignaciones" && (
        <>
          {/* EXPLANATORY HERO BANNER */}
          <div className="coach-hero-banner">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <Building2 size={20} style={{ color: "var(--color-brand-primary)" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
                  Rotación y Desplazamiento de Personal entre Sedes
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", maxWidth: "700px" }}>
                Un colaborador puede trabajar en una sede fija o ser asignado temporalmente a otra sede para cubrir turnos, vacaciones o dictar clases especiales. Aquí controlas las fechas de inicio, término y vigencia.
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenAsignacionModal(null)}
              >
                <MapPin size={16} />
                + Nueva Asignación
              </button>
            )}
          </div>

          {/* FILTERS */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              marginBottom: "20px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ minWidth: "200px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Filtrar por Sede:
              </label>
              <select
                className="form-control"
                value={filtroSedeAsignacion}
                onChange={(e) => setFiltroSedeAsignacion(e.target.value)}
              >
                <option value="">Todas las sedes</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: "220px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Filtrar por Colaborador:
              </label>
              <select
                className="form-control"
                value={filtroEmpleadoAsignacion}
                onChange={(e) => setFiltroEmpleadoAsignacion(e.target.value)}
              >
                <option value="">Todos los colaboradores</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido} ({e.dni})
                  </option>
                ))}
              </select>
            </div>

            {(filtroSedeAsignacion || filtroEmpleadoAsignacion) && (
              <div style={{ alignSelf: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setFiltroSedeAsignacion("");
                    setFiltroEmpleadoAsignacion("");
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* ASSIGNMENTS LIST */}
          {loading ? (
            <LoadingSpinner text="Cargando historial de asignaciones..." />
          ) : asignacionesFiltradas.length === 0 ? (
            <EmptyState
              title="No hay asignaciones registradas"
              description="Actualmente no hay colaboradores asignados bajo los filtros seleccionados."
              actionLabel={isAdmin ? "Crear Primera Asignación" : null}
              onAction={() => handleOpenAsignacionModal(null)}
            />
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-light)" }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "200px" }}>Colaborador</th>
                      <th style={{ minWidth: "180px" }}>Sede de Trabajo</th>
                      <th style={{ minWidth: "130px" }}>Fecha de Inicio</th>
                      <th style={{ minWidth: "150px" }}>Fecha Límite</th>
                      <th style={{ minWidth: "150px" }}>Tipo de Modalidad</th>
                      <th style={{ minWidth: "130px" }}>Estado</th>
                      {isAdmin && <th style={{ minWidth: "180px", textAlign: "right" }}>Gestión</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {asignacionesFiltradas.map((asig) => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const esAnulada = asig.anulada;
                      const esTemporal = Boolean(asig.fechaHasta);
                      const esFinalizada = esTemporal && asig.fechaHasta < todayStr;
                      const esVigente = !esAnulada && !esFinalizada;

                      return (
                        <tr key={asig.id}>
                          <td>
                            <strong style={{ color: "var(--text-main)" }}>
                              {asig.empleadoNombre || `Colaborador #${asig.empleadoId}`}
                            </strong>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Building2 size={16} style={{ color: "var(--color-brand-primary)" }} />
                              <span style={{ fontWeight: 600 }}>{asig.sedeNombre || `Sede #${asig.sedeId}`}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                              <Calendar size={14} style={{ color: "var(--text-muted)" }} />
                              {asig.fechaDesde}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: "13px" }}>
                              {asig.fechaHasta ? (
                                <span style={{ color: esFinalizada ? "var(--text-muted)" : "var(--color-energy)" }}>
                                  {asig.fechaHasta}
                                </span>
                              ) : (
                                <span style={{ color: "var(--color-success)", fontWeight: 600 }}>
                                  Indefinida (Sede Fija)
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge variant={esTemporal ? "info" : "purple"}>
                              {esTemporal ? "Rotación Temporal" : "Sede Principal"}
                            </Badge>
                          </td>
                          <td>
                            {esAnulada ? (
                              <Badge variant="danger">Anulada</Badge>
                            ) : esFinalizada ? (
                              <Badge variant="neutral">Finalizada</Badge>
                            ) : (
                              <Badge variant="success">Vigente Activa</Badge>
                            )}
                          </td>
                          {isAdmin && (
                            <td style={{ textAlign: "right" }}>
                              {!esAnulada && esVigente && (
                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleFinalizarAsignacion(asig.id, asig.empleadoNombre)}
                                    title="Dar por terminada esta rotación hoy"
                                  >
                                    Finalizar Hoy
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleAnularAsignacion(asig.id)}
                                    title="Anular asignación"
                                  >
                                    Anular
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          MODAL: REGISTRAR / EDITAR COLABORADOR
          ========================================================================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={empleadoAEditar ? "Editar Colaborador / Coach" : "Registrar Nuevo Colaborador"}
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
              {saving ? "Guardando..." : empleadoAEditar ? "Actualizar" : "Registrar Colaborador"}
            </button>
          </>
        }
      >
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          {!empleadoAEditar && (
            <div className="form-group">
              <label className="form-label">DNI (8 dígitos) *</label>
              <input
                type="text"
                name="dni"
                maxLength={8}
                required
                className="form-control"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, "") })}
                placeholder="Ej. 74859612"
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                name="nombre"
                required
                className="form-control"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Rodrigo"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input
                type="text"
                name="apellido"
                required
                className="form-control"
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                placeholder="Ej. Navarro"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Rol del Colaborador en el Gimnasio *</label>
            <select
              className="form-control"
              value={form.rolId}
              onChange={(e) => setForm({ ...form, rolId: e.target.value })}
            >
              {ROLES_DISPONIBLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Teléfono (9 dígitos) *</label>
              <input
                type="text"
                name="telefono"
                maxLength={9}
                required
                className="form-control"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/\D/g, "") })}
                placeholder="Ej. 987654321"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                name="correo"
                className="form-control"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                placeholder="coach@fitness.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Especialidad / Cargo Técnico</label>
            <input
              type="text"
              name="especialidad"
              className="form-control"
              value={form.especialidad}
              onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
              placeholder="Ej. Spinning, Musculación, Crossfit, Nutrición Deportiva"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dirección Domiciliaria</label>
            <input
              type="text"
              name="direccion"
              className="form-control"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Av. Principal 123"
            />
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: NUEVA ASIGNACION / ROTACION DE SEDE
          ========================================================================= */}
      <Modal
        isOpen={modalAsignacionOpen}
        onClose={() => setModalAsignacionOpen(false)}
        title="Asignar Colaborador a Sede (Rotación / Sede Fija)"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalAsignacionOpen(false)}
              disabled={savingAsignacion}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAsignacion}
              disabled={savingAsignacion}
            >
              {savingAsignacion ? "Guardando..." : "Confirmar Asignación"}
            </button>
          </>
        }
      >
        {errorAsignacion && <div className="alert alert-danger">{errorAsignacion}</div>}

        <div style={{ background: "rgba(0, 210, 255, 0.08)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid rgba(0, 210, 255, 0.2)", marginBottom: "16px", fontSize: "13px" }}>
          <strong style={{ color: "var(--color-accent)" }}>¿Cómo funciona?</strong>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)" }}>
            Si dejas la <strong>Fecha Límite en blanco</strong>, el colaborador queda asignado de forma fija a esa sede. Si estableces una fecha fin, actuará como una rotación temporal para cubrir días o turnos específicos.
          </p>
        </div>

        <form onSubmit={handleSaveAsignacion}>
          <div className="form-group">
            <label className="form-label">Colaborador / Coach *</label>
            <select
              className="form-control"
              required
              value={formAsignacion.empleadoId}
              onChange={(e) => setFormAsignacion({ ...formAsignacion, empleadoId: e.target.value })}
            >
              <option value="">-- Selecciona un colaborador --</option>
              {empleados
                .filter((e) => e.activo)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido} (DNI: {e.dni}) - {e.rol?.nombre || "Colaborador"}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sede de Destino *</label>
            <select
              className="form-control"
              required
              value={formAsignacion.sedeId}
              onChange={(e) => setFormAsignacion({ ...formAsignacion, sedeId: e.target.value })}
            >
              <option value="">-- Selecciona una sede --</option>
              {sedes
                .filter((s) => s.activa)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} - {s.direccion}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha de Inicio *</label>
              <input
                type="date"
                required
                className="form-control"
                value={formAsignacion.fechaDesde}
                onChange={(e) => setFormAsignacion({ ...formAsignacion, fechaDesde: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Límite (Opcional para rotación)</label>
              <input
                type="date"
                className="form-control"
                value={formAsignacion.fechaHasta}
                onChange={(e) => setFormAsignacion({ ...formAsignacion, fechaHasta: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Empleados;
