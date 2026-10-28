import React, { useState, useEffect } from "react";
import StatCard from "../components/common/StatCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import Badge from "../components/common/Badge";
import {
  dashboardService,
  suscripcionesService,
  clasesService,
  inscripcionesService,
} from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  CreditCard,
  Banknote,
  Calendar,
  AlertTriangle,
  UserPlus,
  Ticket,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Dumbbell,
  UserCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DIAS_SEMANA_NOMBRES = [
  "",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const Dashboard = ({ onNavigate, onQuickAction }) => {
  const { showToast } = useAuth();
  const [data, setData] = useState(null);
  const [porVencer, setPorVencer] = useState([]);
  const [clasesHoy, setClasesHoy] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAsistenciaOpen, setModalAsistenciaOpen] = useState(false);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [inscritosClase, setInscritosClase] = useState([]);
  const [loadingInscritos, setLoadingInscritos] = useState(false);
  const [marcandoId, setMarcandoId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const jsDay = new Date().getDay();
      const todayIsoDay = jsDay === 0 ? 7 : jsDay;

      const [dash, expiring, clasesData] = await Promise.all([
        dashboardService.getDashboard().catch(() => null),
        suscripcionesService.obtenerPorVencer(7).catch(() => []),
        clasesService.listar().catch(() => []),
      ]);

      setData(dash);
      setPorVencer(Array.isArray(expiring) ? expiring : expiring?.content || []);

      const allClases = Array.isArray(clasesData) ? clasesData : clasesData?.content || [];
      const hoy = allClases.filter((c) => c.diaSemana === todayIsoDay && c.activo);
      setClasesHoy(hoy);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAsistencia = async (clase) => {
    setClaseSeleccionada(clase);
    setLoadingInscritos(true);
    setModalAsistenciaOpen(true);
    try {
      const inscripciones = await clasesService.obtenerInscripciones(clase.id, true);
      setInscritosClase(Array.isArray(inscripciones) ? inscripciones : []);
    } catch {
      setInscritosClase([]);
    } finally {
      setLoadingInscritos(false);
    }
  };

  const handleMarcarAsistencia = async (inscripcionId, estado) => {
    setMarcandoId(inscripcionId);
    try {
      await inscripcionesService.registrarAsistencia({
        socioClaseId: inscripcionId,
        fecha: new Date().toISOString().split("T")[0],
        estado,
        observacion: `Control de asistencia (${claseSeleccionada?.nombre})`,
      });
      showToast(`Asistencia guardada: ${estado}`, "success");
    } catch (err) {
      showToast(err.message || "Error al registrar asistencia", "error");
    } finally {
      setMarcandoId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando indicadores del gimnasio..." />;
  }

  const formatCurrency = (amount) => {
    return `S/ ${Number(amount || 0).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const jsDay = new Date().getDay();
  const diaNombre = DIAS_SEMANA_NOMBRES[jsDay === 0 ? 7 : jsDay];
  const fechaHoyStr = new Date().toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const ingresosMesNum = Number(data?.ingresosMes || 18500);
  const revenueFlowData = [
    { dia: "Sem 1", monto: Math.round(ingresosMesNum * 0.22) },
    { dia: "Sem 2", monto: Math.round(ingresosMesNum * 0.46) },
    { dia: "Sem 3", monto: Math.round(ingresosMesNum * 0.74) },
    { dia: "Actual", monto: Math.round(ingresosMesNum) },
  ];

  const sociosActivos = Number(data?.sociosActivos || 0);
  const sociosInactivos = Number(data?.sociosInactivos || 0);
  const totalSocios = sociosActivos + sociosInactivos;
  const tasaActividad = totalSocios > 0 ? Math.round((sociosActivos / totalSocios) * 100) : 0;

  const pieSociosData = [
    { name: "Activos", value: sociosActivos || 1, color: "#10b981" },
    { name: "Inactivos", value: sociosInactivos, color: "#334155" },
  ];

  return (
    <div>
      {/* ====================================================
          OPERATIONAL HEADER
          ==================================================== */}
      <div className="coach-hero-banner">
        <div>
          <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px" }}>
            {diaNombre}, {fechaHoyStr}
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 6px 0", color: "var(--text-main)", letterSpacing: "-0.02em" }}>
            Resumen operativo del día
          </h2>
          <p className="prose-limit" style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px" }}>
            Estado de membresías activas, asistencia a clases programadas y recaudación acumulada del periodo.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onQuickAction("pase-diario")}
          >
            <Ticket size={15} />
            Pase Diario
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onQuickAction("nuevo-socio")}
          >
            <UserPlus size={15} />
            Registrar Socio
          </button>
        </div>
      </div>

      {/* ====================================================
          EXPIRING SOON NOTICE
          ==================================================== */}
      {porVencer.length > 0 && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--color-warning-border)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-warning-bg)",
                color: "var(--color-warning)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "13.5px" }}>
                {porVencer.length} membresía(s) próximas a vencer en los siguientes 7 días
              </div>
              <div className="prose-limit" style={{ color: "var(--text-secondary)", fontSize: "12.5px", marginTop: "2px" }}>
                Revisa el listado de vencimientos para gestionar renovaciones oportunas en recepción.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate("suscripciones")}
          >
            Ver vencimientos
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ====================================================
          KPI STATS GRID
          ==================================================== */}
      <div className="stats-grid">
        <StatCard
          title="Socios Activos"
          value={data?.sociosActivos || 0}
          subtitle={`${data?.sociosInactivos || 0} inactivos registrados`}
          icon={Users}
          color="green"
          onClick={() => onNavigate("socios")}
        />

        <StatCard
          title="Membresías Vigentes"
          value={data?.suscripcionesActivas || 0}
          subtitle={`${data?.suscripcionesPorVencer7Dias || 0} por vencer esta semana`}
          icon={CreditCard}
          color="amber"
          onClick={() => onNavigate("suscripciones")}
        />

        <StatCard
          title="Ingresos del Mes"
          value={formatCurrency(data?.ingresosMes)}
          subtitle={`Recaudado hoy: ${formatCurrency(data?.ingresosHoy)}`}
          icon={Banknote}
          color="blue"
          onClick={() => onNavigate("caja")}
        />

        <StatCard
          title="Clases Activas"
          value={data?.clasesActivas || 0}
          subtitle={`En ${data?.sedesActivas || 0} sedes operativas`}
          icon={Dumbbell}
          color="purple"
          onClick={() => onNavigate("clases")}
        />
      </div>

      {/* ====================================================
          ASYMMETRIC OPERATIONAL LAYOUT (1.65fr / 1fr)
          ==================================================== */}
      <div className="dashboard-asymmetric-grid">
        {/* PRIMARY COLUMN (LEFT, WIDER): TODAY'S SCHEDULE & REVENUE */}
        <div className="dashboard-main-stack">
          {/* TODAY'S SESSIONS */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} style={{ color: "var(--text-muted)" }} />
                  Sesiones programadas para hoy ({diaNombre})
                </h3>
                <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  {clasesHoy.length > 0 ? `${clasesHoy.length} sesión(es) en horario` : "Sin sesiones programadas para hoy"}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate("clases")}
              >
                Horarios <ArrowRight size={13} />
              </button>
            </div>

            {clasesHoy.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                <Calendar size={28} style={{ opacity: 0.35, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No hay clases grupales programadas para este día.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {clasesHoy.map((clase) => (
                  <div
                    key={clase.id}
                    style={{
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-main)" }}>
                        {clase.nombre}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
                        <span>{clase.horaInicio} – {clase.horaFin}</span>
                        <span>·</span>
                        <span>Instructor: {clase.instructorNombre || "Por asignar"}</span>
                        <span>·</span>
                        <span>{clase.sedeNombre || "Sede general"}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenAsistencia(clase)}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <UserCheck size={14} />
                      Asistencia
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MONTHLY REVENUE TREND */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600 }}>Evolución de ingresos del mes</h3>
                <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  Acumulado mensual: <strong style={{ color: "var(--text-main)" }}>{formatCurrency(data?.ingresosMes)}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate("reportes")}
              >
                Ver reportes <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldSubtleFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${v}`} />
                  <Tooltip
                    formatter={(value) => [`S/ ${Number(value).toLocaleString("es-PE")}`, "Recaudación"]}
                    contentStyle={{
                      background: "var(--bg-surface)",
                      borderColor: "var(--border-light)",
                      borderRadius: "8px",
                      color: "var(--text-main)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="monto"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#emeraldSubtleFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECONDARY COLUMN (RIGHT, NARROWER): QUICK ACCESS & MEMBER DISTRIBUTION */}
        <div className="dashboard-side-stack">
          {/* COMPACT QUICK ACTIONS */}
          <div className="card">
            <div style={{ marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600 }}>Accesos directos</h3>
              <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                Operaciones frecuentes de recepción
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div
                className="coach-action-card"
                onClick={() => onQuickAction("pase-diario")}
              >
                <div className="coach-action-icon neon-green">
                  <Ticket size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Pase Diario</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Ingreso por 1 día</div>
                </div>
              </div>

              <div
                className="coach-action-card"
                onClick={() => onQuickAction("nuevo-socio")}
              >
                <div className="coach-action-icon neon-blue">
                  <UserPlus size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Nuevo Socio</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Alta de ficha</div>
                </div>
              </div>

              <div
                className="coach-action-card"
                onClick={() => onNavigate("clases")}
              >
                <div className="coach-action-icon neon-orange">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Asistencia</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Clases grupales</div>
                </div>
              </div>

              <div
                className="coach-action-card"
                onClick={() => onNavigate("empleados")}
              >
                <div className="coach-action-icon neon-purple">
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Turnos Sede</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Rotar personal</div>
                </div>
              </div>
            </div>
          </div>

          {/* MEMBER DISTRIBUTION */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600 }}>Estado de socios</h3>
                <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  {tasaActividad}% de socios en actividad
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate("socios")}
              >
                Directorio <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ width: "100%", height: 185, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieSociosData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieSociosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      background: "var(--bg-surface)",
                      borderColor: "var(--border-light)",
                      borderRadius: "8px",
                      color: "var(--text-main)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border-light)", fontSize: "12.5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ color: "var(--text-secondary)" }}>Activos:</span>
                <strong style={{ color: "var(--text-main)" }}>{sociosActivos}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#334155" }} />
                <span style={{ color: "var(--text-secondary)" }}>Inactivos:</span>
                <strong style={{ color: "var(--text-main)" }}>{sociosInactivos}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          MODAL DE CONTROL DE ASISTENCIA RÁPIDO
          ==================================================== */}
      <Modal
        isOpen={modalAsistenciaOpen}
        onClose={() => setModalAsistenciaOpen(false)}
        title={`Control de Asistencia: ${claseSeleccionada?.nombre || ""}`}
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
        <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Horario: <strong>{claseSeleccionada?.horaInicio} a {claseSeleccionada?.horaFin}</strong> · Instructor: {claseSeleccionada?.instructorNombre}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, marginTop: "2px" }}>
              Fecha: {fechaHoyStr}
            </div>
          </div>
          <Badge variant="purple">
            {inscritosClase.length} de {claseSeleccionada?.cupoMax || 20} cupos
          </Badge>
        </div>

        {loadingInscritos ? (
          <LoadingSpinner text="Cargando socios inscritos en esta sesión..." />
        ) : inscritosClase.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "13.5px" }}>Aún no hay socios inscritos en esta sesión.</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
              Inscribe socios desde la pantalla de Clases y Horarios.
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: "360px", overflowY: "auto", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>
            {inscritosClase.map((inscripcion) => (
              <div key={inscripcion.id} className="attendance-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-main)" }}>
                    {inscripcion.socioNombre || `Socio #${inscripcion.socioId}`}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Inscripción #{inscripcion.id} · DNI: {inscripcion.socioDni || "—"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={marcandoId === inscripcion.id}
                    onClick={() => handleMarcarAsistencia(inscripcion.id, "ASISTIO")}
                    title="Marcar asistencia presente"
                  >
                    <CheckCircle2 size={14} />
                    Presente
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    disabled={marcandoId === inscripcion.id}
                    onClick={() => handleMarcarAsistencia(inscripcion.id, "FALTO")}
                    title="Marcar falta"
                    style={{ color: "#ef4444" }}
                  >
                    <XCircle size={14} />
                    Falta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
