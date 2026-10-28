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
  { id: 1, nombre: "ADMINISTRADOR", desc: "Acceso global a todos los módulos y sedes" },
  { id: 2, nombre: "SUPERVISOR", desc: "Supervisión global operativa y reportes" },
  { id: 3, nombre: "INSTRUCTOR", desc: "Entrenador, rutinas y dictado de clases (Asignable a sede)" },
  { id: 4, nombre: "RECEPCIONISTA", desc: "Atención, registro de socios y caja (Asignable a sede)" },
];

const getLocalToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const obtenerRolEmpleado = (emp) => {
  if (!emp) return "INSTRUCTOR";
  const codigo =
    emp.rolCodigo ||
    emp.rolNombre ||
    emp.rol?.codigo ||
    emp.rol?.nombre ||
    ROLES_DISPONIBLES.find((r) => Number(r.id) === Number(emp.rolId))?.nombre ||
    "INSTRUCTOR";
  return String(codigo).toUpperCase().trim();
};

// Todos los roles MENOS Administrador y Supervisor pueden ser asignados a una sede
const esRolAsignableASede = (emp) => {
  const rol = obtenerRolEmpleado(emp);
  return !["ADMINISTRADOR", "ADMIN", "SUPERVISOR"].includes(rol);
};

const Empleados = () => {
  const { usuario, isAdmin, showToast } = useAuth();
  const esSuperOAdmin = isAdmin || usuario?.rol === "SUPERVISOR";
  const [activeSubTab, setActiveSubTab] = useState(() => (esSuperOAdmin ? "directorio" : "asignaciones"));

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
    rolId: 3,
    telefono: "",
    correo: "",
    direccion: "",
    especialidad: "Entrenamiento Funcional y Musculación",
  });

  // ASSIGNMENTS & ROTATION STATE
  const [asignaciones, setAsignaciones] = useState([]);
  const [filtroSedeAsignacion, setFiltroSedeAsignacion] = useState("");
  const [filtroEmpleadoAsignacion, setFiltroEmpleadoAsignacion] = useState("");
  const [filtroEstadoAsignacion, setFiltroEstadoAsignacion] = useState("VIGENTES"); // "VIGENTES" | "HISTORIAL" | "TODAS"
  const [modalAsignacionOpen, setModalAsignacionOpen] = useState(false);
  const [savingAsignacion, setSavingAsignacion] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState("");

  const [formAsignacion, setFormAsignacion] = useState({
    empleadoId: "",
    sedeId: "",
    fechaDesde: getLocalToday(),
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
        especialidad: "Musculación y Entrenamiento Funcional",
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
    if (
      !empleadoAEditar &&
      empleados.some((emp) => emp.dni && emp.dni.trim() === form.dni.trim())
    ) {
      setErrorMsg(
        `Ya se encuentra registrado un colaborador con el DNI ${form.dni.trim()}. Verifica el documento en el directorio.`
      );
      return;
    }
    if (!form.nombre.trim() || form.nombre.trim().length < 2) {
      setErrorMsg("El nombre del colaborador es obligatorio (mínimo 2 caracteres).");
      return;
    }
    if (!form.apellido.trim() || form.apellido.trim().length < 2) {
      setErrorMsg("El apellido del colaborador es obligatorio (mínimo 2 caracteres).");
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
      setErrorMsg("El correo electrónico debe tener el formato usuario@correo.com.");
      return;
    }
    if (
      form.correo &&
      empleados.some(
        (emp) =>
          emp.correo &&
          emp.correo.trim().toLowerCase() === form.correo.trim().toLowerCase() &&
          (!empleadoAEditar || Number(emp.id) !== Number(empleadoAEditar.id))
      )
    ) {
      setErrorMsg("El correo electrónico ingresado ya está vinculado a otro colaborador.");
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

  // Empleados elegibles para ser asignados a una sede (Activos y rol != ADMINISTRADOR / SUPERVISOR)
  const empleadosAsignables = empleados.filter((e) => e.activo && esRolAsignableASede(e));

  const calcularFechaHastaRotacion = (desdeStr, duracionOpcion) => {
    if (!desdeStr) return "";
    if (duracionOpcion === "custom") return "";
    const dias = Number(duracionOpcion || 1);
    const d = new Date(desdeStr + "T00:00:00");
    d.setDate(d.getDate() + dias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // OPEN MODAL ASIGNACION / ROTACION
  const handleOpenAsignacionModal = (empDefault = null) => {
    // Si no es admin ni supervisor, sólo puede rotarse a sí mismo
    let defaultEmpId = "";
    if (!esSuperOAdmin) {
      const selfEmp = empleados.find(
        (e) =>
          (usuario?.empleadoId && Number(e.id) === Number(usuario.empleadoId)) ||
          (usuario?.correo && e.correo && e.correo.toLowerCase() === usuario.correo.toLowerCase()) ||
          (usuario?.dni && e.dni === usuario.dni) ||
          (usuario?.id && Number(e.id) === Number(usuario.id))
      );
      defaultEmpId = selfEmp ? String(selfEmp.id) : (usuario?.empleadoId ? String(usuario.empleadoId) : "");
    } else {
      defaultEmpId = empDefault?.id ? String(empDefault.id) : (empleadosAsignables[0]?.id ? String(empleadosAsignables[0].id) : "");
    }

    const today = getLocalToday();
    const fin1Dia = calcularFechaHastaRotacion(today, "1");

    setFormAsignacion({
      empleadoId: String(defaultEmpId),
      sedeId: sedes[0]?.id ? String(sedes[0].id) : "",
      fechaDesde: today,
      duracionOpcion: "1",
      fechaHasta: fin1Dia,
    });
    setErrorAsignacion("");
    setModalAsignacionOpen(true);
  };

  const handleDuracionChange = (opcion) => {
    let hasta = formAsignacion.fechaHasta;
    if (opcion !== "custom") {
      hasta = calcularFechaHastaRotacion(formAsignacion.fechaDesde, opcion);
    }
    setFormAsignacion((prev) => ({
      ...prev,
      duracionOpcion: opcion,
      fechaHasta: hasta,
    }));
  };

  const handleFechaDesdeChange = (nuevaDesde) => {
    let hasta = formAsignacion.fechaHasta;
    if (formAsignacion.duracionOpcion !== "custom") {
      hasta = calcularFechaHastaRotacion(nuevaDesde, formAsignacion.duracionOpcion);
    }
    setFormAsignacion((prev) => ({
      ...prev,
      fechaDesde: nuevaDesde,
      fechaHasta: hasta,
    }));
  };

  // SUBMIT ASIGNACION / ROTACION
  const handleSaveAsignacion = async (e) => {
    e.preventDefault();
    setErrorAsignacion("");

    let targetEmpleadoId = formAsignacion.empleadoId;
    if (!esSuperOAdmin) {
      const selfEmp = empleados.find(
        (e) =>
          (usuario?.empleadoId && Number(e.id) === Number(usuario.empleadoId)) ||
          (usuario?.correo && e.correo && e.correo.toLowerCase() === usuario.correo.toLowerCase()) ||
          (usuario?.dni && e.dni === usuario.dni) ||
          (usuario?.id && Number(e.id) === Number(usuario.id))
      );
      targetEmpleadoId = selfEmp ? String(selfEmp.id) : (usuario?.empleadoId ? String(usuario.empleadoId) : formAsignacion.empleadoId);
    }

    if (!targetEmpleadoId) {
      setErrorAsignacion("Debes seleccionar un colaborador.");
      return;
    }
    if (!formAsignacion.sedeId) {
      setErrorAsignacion("Debes seleccionar una sede de destino.");
      return;
    }
    if (
      formAsignacion.fechaHasta &&
      formAsignacion.fechaDesde &&
      formAsignacion.fechaHasta < formAsignacion.fechaDesde
    ) {
      setErrorAsignacion("La fecha límite de rotación no puede ser anterior a la fecha de inicio.");
      return;
    }

    const empObj = empleados.find((emp) => Number(emp.id) === Number(targetEmpleadoId));
    if (empObj && !esRolAsignableASede(empObj)) {
      setErrorAsignacion(
        "Los colaboradores con rol Administrador o Supervisor tienen alcance en todas las sedes y no requieren rotación por sede."
      );
      return;
    }

    setSavingAsignacion(true);
    try {
      await asignacionesService.asignar({
        empleadoId: Number(targetEmpleadoId),
        sedeId: Number(formAsignacion.sedeId),
        fechaDesde: formAsignacion.fechaDesde || null,
        fechaHasta: formAsignacion.fechaHasta || null,
      });

      showToast("Rotación de personal registrada correctamente", "success");
      setModalAsignacionOpen(false);
      setFiltroEstadoAsignacion("VIGENTES");
      cargarDatos();
    } catch (err) {
      setErrorAsignacion(err.message || "Error al registrar la rotación.");
    } finally {
      setSavingAsignacion(false);
    }
  };

  // Determinar estado real de una rotación
  const evaluarEstadoAsignacion = (asig) => {
    const todayStr = getLocalToday();
    const esAnulada = Boolean(asig.anulada);
    const tieneFechaFin = Boolean(asig.fechaHasta);
    // Si tiene fechaHasta menor estricta a hoy, ya concluyó
    const esFinalizada = !esAnulada && tieneFechaFin && asig.fechaHasta < todayStr;
    const esProgramada = !esAnulada && !esFinalizada && Boolean(asig.fechaDesde) && asig.fechaDesde > todayStr;
    const esVigente = !esAnulada && !esFinalizada && !esProgramada;
    return { esAnulada, tieneFechaFin, esFinalizada, esProgramada, esVigente };
  };

  // Helper: Obtener Sede Base (fija: fechaHasta == null) y Rotación Activa
  const obtenerSedeInfoEmpleado = (empId) => {
    const asigsEmp = asignaciones.filter((a) => Number(a.empleadoId) === Number(empId) && !a.anulada);
    const fija = asigsEmp.find((a) => !a.fechaHasta);
    const rotacionActiva = asigsEmp.find((a) => {
      const { esVigente, tieneFechaFin } = evaluarEstadoAsignacion(a);
      return esVigente && tieneFechaFin;
    });
    return {
      sedeBase: fija ? fija.sedeNombre || `Sede #${fija.sedeId}` : null,
      rotacionActiva: rotacionActiva ? (rotacionActiva.sedeNombre || `Sede #${rotacionActiva.sedeId}`) : null,
      rotacionFin: rotacionActiva ? rotacionActiva.fechaHasta : null,
    };
  };

  // FINALIZAR ROTACIÓN (CULMINAR INMEDIATAMENTE)
  const handleFinalizarAsignacion = async (asig) => {
    const nombre = asig.empleadoNombre || `Colaborador #${asig.empleadoId}`;
    if (!window.confirm(`¿Dar por culminada la rotación de ${nombre} en ${asig.sedeNombre || "esta sede"}? Volverá a su sede base de inmediato.`)) {
      return;
    }
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      await asignacionesService.finalizar(asig.id, {
        fechaHasta: yesterdayStr,
      });

      // Actualización inmediata en memoria para que desaparezca de "Vigentes" al instante
      setAsignaciones((prev) =>
        prev.map((item) =>
          item.id === asig.id ? { ...item, fechaHasta: yesterdayStr } : item
        )
      );

      showToast("Rotación culminada. El colaborador vuelve a su sede base.", "success");
      cargarDatos();
    } catch (err) {
      showToast(err.message || "Error al finalizar rotación", "error");
    }
  };

  // ANULAR ASIGNACION
  const handleAnularAsignacion = async (id) => {
    if (!window.confirm("¿Estás seguro de anular esta asignación? Esta acción es irreversible.")) return;
    try {
      await asignacionesService.anular(id);
      setAsignaciones((prev) =>
        prev.map((item) => (item.id === id ? { ...item, anulada: true } : item))
      );
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
      emp.especialidad?.toLowerCase().includes(term) ||
      obtenerRolEmpleado(emp).toLowerCase().includes(term)
    );
  });

  const miEmpleadoId =
    usuario?.empleadoId ||
    empleados.find(
      (e) =>
        (usuario?.empleadoId && Number(e.id) === Number(usuario.empleadoId)) ||
        (usuario?.correo && e.correo && e.correo.toLowerCase() === usuario.correo.toLowerCase()) ||
        (usuario?.dni && e.dni === usuario.dni) ||
        (usuario?.id && Number(e.id) === Number(usuario.id))
    )?.id ||
    null;

  // En la pestaña de Rotación solo mostramos rotaciones temporales (tienen fechaHasta definido)
  // Si no es administrador o supervisor, se listan exclusivamente las rotaciones del empleado en sesión
  const soloRotaciones = asignaciones
    .filter((a) => Boolean(a.fechaHasta))
    .filter((a) => {
      if (!esSuperOAdmin && miEmpleadoId) {
        return Number(a.empleadoId) === Number(miEmpleadoId);
      }
      return true;
    });
  const totalRotacionesVigentes = soloRotaciones.filter((a) => evaluarEstadoAsignacion(a).esVigente).length;
  const totalRotacionesHistorial = soloRotaciones.filter((a) => !evaluarEstadoAsignacion(a).esVigente).length;

  const rotacionesFiltradas = soloRotaciones.filter((asig) => {
    if (filtroSedeAsignacion && String(asig.sedeId) !== String(filtroSedeAsignacion)) {
      return false;
    }
    if (filtroEmpleadoAsignacion && String(asig.empleadoId) !== String(filtroEmpleadoAsignacion)) {
      return false;
    }
    const { esVigente } = evaluarEstadoAsignacion(asig);
    if (filtroEstadoAsignacion === "VIGENTES" && !esVigente) {
      return false;
    }
    if (filtroEstadoAsignacion === "HISTORIAL" && esVigente) {
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
              {esSuperOAdmin ? (
                <>
                  <Briefcase size={20} style={{ color: "var(--color-brand-primary)" }} />
                  Personal y Control de Sedes
                </>
              ) : (
                <>
                  <Building2 size={20} style={{ color: "var(--color-brand-primary)" }} />
                  Rotación de Sede de Trabajo
                </>
              )}
            </h2>
            <p className="prose-limit">
              {esSuperOAdmin
                ? "Directorio de instructores, recepción y control de rotaciones por sede"
                : "Consulta tus rotaciones programadas y rota tu sede de trabajo temporalmente"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarDatos}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "spinner" : ""} />
              Actualizar
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleOpenAsignacionModal(null)}
                >
                  <MapPin size={15} />
                  Asignar / Rotar Sede
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenModal(null)}
                >
                  <UserPlus size={15} />
                  Registrar Personal
                </button>
              </>
            )}
            {!esSuperOAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenAsignacionModal(null)}
              >
                <RefreshCw size={15} />
                Rotar mi Sede
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUB-TABS SELECTOR: SOLO VISIBLE PARA ADMINISTRADORES Y SUPERVISORES */}
      {esSuperOAdmin && (
        <div className="nav-pills" style={{ marginBottom: "22px" }}>
          <button
            type="button"
            className={`nav-pill ${activeSubTab === "directorio" ? "active" : ""}`}
            onClick={() => setActiveSubTab("directorio")}
          >
            <Dumbbell size={15} />
            Directorio del Personal ({empleados.length})
          </button>
          <button
            type="button"
            className={`nav-pill ${activeSubTab === "asignaciones" ? "active" : ""}`}
            onClick={() => setActiveSubTab("asignaciones")}
          >
            <Building2 size={15} />
            Rotación de Personal ({totalRotacionesVigentes} vigentes)
          </button>
        </div>
      )}

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
                placeholder="Buscar por DNI, nombre, rol o especialidad..."
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
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                <input
                  type="checkbox"
                  checked={soloInstructores}
                  onChange={(e) => setSoloInstructores(e.target.checked)}
                />
                Mostrar solo instructores
              </label>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner text="Cargando colaboradores..." />
          ) : empleadosFiltrados.length === 0 ? (
            <EmptyState
              title="No se encontraron colaboradores"
              description={searchTerm ? "Intenta con otro término de búsqueda." : "Comienza registrando a tu personal o entrenadores."}
              actionLabel={esSuperOAdmin ? "Registrar Primer Colaborador" : null}
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
                      <th style={{ minWidth: "180px" }}>Sede Base / Fija</th>
                      <th style={{ minWidth: "150px" }}>Especialidad</th>
                      <th style={{ minWidth: "160px" }}>Contacto</th>
                      <th style={{ minWidth: "100px" }}>Estado</th>
                      {esSuperOAdmin && <th style={{ minWidth: "130px", textAlign: "right" }}>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {empleadosFiltrados.map((emp) => {
                      const rolNombre = obtenerRolEmpleado(emp);
                      const puedeAsignarSede = esRolAsignableASede(emp);
                      const { sedeBase, rotacionActiva, rotacionFin } = obtenerSedeInfoEmpleado(emp.id);

                      return (
                        <tr key={emp.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "var(--radius-md)",
                                  background: "var(--color-brand-muted)",
                                  color: "var(--color-brand-primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  border: "1px solid rgba(16, 185, 129, 0.25)",
                                }}
                              >
                                {emp.nombre?.charAt(0)}
                                {emp.apellido?.charAt(0)}
                              </div>
                              <div>
                                <strong style={{ color: "var(--text-main)", fontSize: "14px", fontWeight: 600 }}>
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
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                              <Badge
                                variant={
                                  rolNombre === "ADMINISTRADOR" || rolNombre === "ADMIN"
                                    ? "purple"
                                    : rolNombre === "SUPERVISOR"
                                    ? "warning"
                                    : rolNombre === "INSTRUCTOR"
                                    ? "success"
                                    : rolNombre === "RECEPCIONISTA"
                                    ? "blue"
                                    : "neutral"
                                }
                              >
                                {rolNombre}
                              </Badge>
                              {!puedeAsignarSede && (
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  Acceso global (todas las sedes)
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {!puedeAsignarSede ? (
                              <span style={{ fontSize: "12.5px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                Todas las sedes (Global)
                              </span>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                                  <Building2 size={14} style={{ color: "var(--color-brand-primary)" }} />
                                  <span>{sedeBase || "Sin sede fija asignada"}</span>
                                </div>
                                {rotacionActiva && (
                                  <Badge variant="warning" dot>
                                    🔄 En rotación: {rotacionActiva} (hasta {rotacionFin})
                                  </Badge>
                                )}
                              </div>
                            )}
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
                          {esSuperOAdmin && (
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                {puedeAsignarSede && (
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    onClick={() => handleOpenAsignacionModal(emp)}
                                    title="Programar rotación de sede"
                                    style={{ color: "var(--color-accent)" }}
                                  >
                                    <MapPin size={16} />
                                  </button>
                                )}
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
          SUB-TAB 2: ROTACIÓN DE PERSONAL
          ========================================================================= */}
      {activeSubTab === "asignaciones" && (
        <>
          {/* EXPLANATORY HERO BANNER */}
          <div className="coach-hero-banner">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <Building2 size={18} style={{ color: "var(--color-brand-primary)" }} />
                <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600, color: "var(--text-main)" }}>
                  {esSuperOAdmin ? "Rotación de Personal entre Sedes" : "Mi Rotación de Sede de Trabajo"}
                </h3>
              </div>
              <p className="prose-limit" style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                {esSuperOAdmin
                  ? "Aquí se gestionan exclusivamente los desplazamientos temporales por días o semanas. Todo el personal operativo puede rotar (los instructores o recepcionistas pueden rotarse ellos mismos; Administradores y Supervisores pueden rotar a cualquier colaborador)."
                  : "Programa tu turno o rotación temporal en otra sede (1 día, 2 días, 1 semana, etc.). Al culminar el plazo asignado volverás automáticamente a tu sede base."}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenAsignacionModal(null)}
            >
              <MapPin size={15} />
              {esSuperOAdmin ? "Nueva Rotación" : "Rotar mi Sede"}
            </button>
          </div>

          {/* FILTERS */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              marginBottom: "20px",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ minWidth: "200px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Filtrar por Sede de Destino:
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

              {esSuperOAdmin && (
                <div style={{ minWidth: "240px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Filtrar por Colaborador:
                  </label>
                  <select
                    className="form-control"
                    value={filtroEmpleadoAsignacion}
                    onChange={(e) => setFiltroEmpleadoAsignacion(e.target.value)}
                  >
                    <option value="">Todos los colaboradores</option>
                    {empleados
                      .filter((e) => esRolAsignableASede(e))
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre} {e.apellido} ({obtenerRolEmpleado(e)})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {(filtroSedeAsignacion || filtroEmpleadoAsignacion || filtroEstadoAsignacion !== "VIGENTES") && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setFiltroSedeAsignacion("");
                    setFiltroEmpleadoAsignacion("");
                    setFiltroEstadoAsignacion("VIGENTES");
                  }}
                >
                  Restablecer filtros
                </button>
              )}
            </div>

            <div className="nav-pills" style={{ margin: 0 }}>
              <button
                type="button"
                className={`nav-pill ${filtroEstadoAsignacion === "VIGENTES" ? "active" : ""}`}
                onClick={() => setFiltroEstadoAsignacion("VIGENTES")}
              >
                Rotaciones Vigentes ({totalRotacionesVigentes})
              </button>
              <button
                type="button"
                className={`nav-pill ${filtroEstadoAsignacion === "HISTORIAL" ? "active" : ""}`}
                onClick={() => setFiltroEstadoAsignacion("HISTORIAL")}
              >
                Historial Finalizadas ({totalRotacionesHistorial})
              </button>
              <button
                type="button"
                className={`nav-pill ${filtroEstadoAsignacion === "TODAS" ? "active" : ""}`}
                onClick={() => setFiltroEstadoAsignacion("TODAS")}
              >
                Todas ({soloRotaciones.length})
              </button>
            </div>
          </div>

          {/* ASSIGNMENTS LIST */}
          {loading ? (
            <LoadingSpinner text="Cargando rotaciones de personal..." />
          ) : rotacionesFiltradas.length === 0 ? (
            <EmptyState
              title={
                filtroEstadoAsignacion === "VIGENTES"
                  ? "No hay rotaciones activas"
                  : "No se encontraron rotaciones"
              }
              description={
                filtroEstadoAsignacion === "VIGENTES" && totalRotacionesHistorial > 0
                  ? `No hay rotaciones temporales vigentes actualmente. Tienes ${totalRotacionesHistorial} en el historial.`
                  : "Todo el personal se encuentra prestando servicios en sus sedes base fijas."
              }
              actionLabel="Programar Nueva Rotación"
              onAction={() => handleOpenAsignacionModal(null)}
            />
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-light)" }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "210px" }}>Colaborador</th>
                      <th style={{ minWidth: "180px" }}>Sede de Rotación</th>
                      <th style={{ minWidth: "120px" }}>Fecha Inicio</th>
                      <th style={{ minWidth: "120px" }}>Fecha Término</th>
                      <th style={{ minWidth: "130px" }}>Estado</th>
                      <th style={{ minWidth: "160px", textAlign: "right" }}>Gestión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rotacionesFiltradas.map((asig) => {
                      const { esAnulada, tieneFechaFin, esFinalizada, esProgramada, esVigente } =
                        evaluarEstadoAsignacion(asig);
                      const empObj = empleados.find((e) => Number(e.id) === Number(asig.empleadoId));
                      const rolEmp = empObj ? obtenerRolEmpleado(empObj) : null;
                      const esMio = empObj && (empObj.correo === usuario?.correo || empObj.dni === usuario?.dni || Number(empObj.id) === Number(usuario?.id));
                      const puedeGestionar = esSuperOAdmin || esMio;

                      return (
                        <tr key={asig.id} style={{ opacity: esFinalizada || esAnulada ? 0.72 : 1 }}>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <strong style={{ color: "var(--text-main)", fontWeight: 600 }}>
                                {asig.empleadoNombre || (empObj ? `${empObj.nombre} ${empObj.apellido}` : `Colaborador #${asig.empleadoId}`)}
                              </strong>
                              {rolEmp && (
                                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                  {rolEmp}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Building2 size={15} style={{ color: "var(--color-brand-primary)" }} />
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
                            <div style={{ fontSize: "13px", fontWeight: 500, color: esFinalizada ? "var(--text-muted)" : "var(--color-warning)" }}>
                              {asig.fechaHasta}
                            </div>
                          </td>
                          <td>
                            {esAnulada ? (
                              <Badge variant="danger">Anulada</Badge>
                            ) : esFinalizada ? (
                              <Badge variant="neutral">Finalizada</Badge>
                            ) : esProgramada ? (
                              <Badge variant="info">Programada</Badge>
                            ) : (
                              <Badge variant="success">Vigente</Badge>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {puedeGestionar && esVigente ? (
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleFinalizarAsignacion(asig)}
                                  title="Dar por culminada la rotación y regresar a la sede base"
                                >
                                  Finalizar
                                </button>
                                {esSuperOAdmin && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleAnularAsignacion(asig.id)}
                                    title="Anular rotación"
                                  >
                                    Anular
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                {esAnulada ? "Registro anulado" : esFinalizada ? `Culminada (${asig.fechaHasta})` : "Sin acciones"}
                              </span>
                            )}
                          </td>
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
          MODAL: PROGRAMAR ROTACIÓN DE PERSONAL
          ========================================================================= */}
      <Modal
        isOpen={modalAsignacionOpen}
        onClose={() => setModalAsignacionOpen(false)}
        title={esSuperOAdmin ? "Programar Rotación Temporal de Personal" : "Programar Mi Rotación de Sede"}
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
              {savingAsignacion ? "Guardando..." : "Confirmar Rotación"}
            </button>
          </>
        }
      >
        {errorAsignacion && <div className="alert alert-danger">{errorAsignacion}</div>}

        <div className="prose-limit" style={{ background: "var(--bg-surface-elevated)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)", marginBottom: "16px", fontSize: "13px" }}>
          <strong style={{ color: "var(--text-main)", fontWeight: 600 }}>Rotación temporal simplificada</strong>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Selecciona la fecha de inicio y la duración de la rotación (1 día, 2 días, 1 semana, etc.). El sistema calculará automáticamente la fecha fin y reincorporará al colaborador a su sede base al culminar el plazo.
          </p>
        </div>

        <form onSubmit={handleSaveAsignacion}>
          <div className="form-group">
            <label className="form-label">Colaborador Operativo *</label>
            {!esSuperOAdmin ? (
              <div>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={
                    (() => {
                      const empSel = empleados.find((e) => String(e.id) === String(formAsignacion.empleadoId));
                      if (empSel) {
                        return `${empSel.nombre} ${empSel.apellido} (DNI: ${empSel.dni}) — ${obtenerRolEmpleado(empSel)}`;
                      }
                      return usuario?.nombreCompleto || usuario?.username || "Tú (Colaborador en Turno)";
                    })()
                  }
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Estás programando tu propia rotación de sede de trabajo.
                </span>
              </div>
            ) : (
              <select
                className="form-control"
                required
                value={formAsignacion.empleadoId}
                onChange={(e) => setFormAsignacion({ ...formAsignacion, empleadoId: e.target.value })}
              >
                <option value="">-- Selecciona un colaborador --</option>
                {empleadosAsignables.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido} (DNI: {e.dni}) — {obtenerRolEmpleado(e)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Sede de Destino para la Rotación *</label>
            <select
              className="form-control"
              required
              value={formAsignacion.sedeId}
              onChange={(e) => setFormAsignacion({ ...formAsignacion, sedeId: e.target.value })}
            >
              <option value="">-- Selecciona sede de rotación --</option>
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
                onChange={(e) => handleFechaDesdeChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duración de la Rotación *</label>
              <select
                className="form-control"
                value={formAsignacion.duracionOpcion || "1"}
                onChange={(e) => handleDuracionChange(e.target.value)}
              >
                <option value="1">1 día (Turno diario)</option>
                <option value="2">2 días</option>
                <option value="3">3 días</option>
                <option value="7">1 semana (7 días)</option>
                <option value="15">15 días (Quincena)</option>
                <option value="30">1 mes (30 días)</option>
                <option value="custom">Personalizado (Elegir fecha fin)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha Término de Rotación *</label>
            <input
              type="date"
              required
              readOnly={formAsignacion.duracionOpcion !== "custom"}
              className="form-control"
              style={formAsignacion.duracionOpcion !== "custom" ? { background: "var(--bg-surface-elevated)", color: "var(--text-main)", cursor: "not-allowed" } : {}}
              value={formAsignacion.fechaHasta}
              onChange={(e) => setFormAsignacion({ ...formAsignacion, fechaHasta: e.target.value })}
            />
            {formAsignacion.fechaDesde && formAsignacion.fechaHasta && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  fontSize: "12.5px",
                  color: "var(--color-brand-primary)",
                  fontWeight: 500,
                }}
              >
                📅 La rotación inicia el <strong>{formAsignacion.fechaDesde}</strong> y culmina el <strong>{formAsignacion.fechaHasta} a las 00:00</strong>. Al finalizar, regresa automáticamente a su sede base.
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Empleados;
