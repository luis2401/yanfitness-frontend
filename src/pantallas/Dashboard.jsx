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
  Building2,
  Calendar,
  AlertTriangle,
  UserPlus,
  Ticket,
  TrendingUp,
  ArrowRight,
  PieChart as PieIcon,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
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
  const { usuario, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [porVencer, setPorVencer] = useState([]);
  const [clasesHoy, setClasesHoy] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Attendance modal from Dashboard
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
        observacion: `Marcado desde Fitness Hub (${claseSeleccionada?.nombre})`,
      });
      showToast(`Asistencia guardada: ${estado}`, "success");
    } catch (err) {
      showToast(err.message || "Error al registrar asistencia", "error");
    } finally {
      setMarcandoId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Sincronizando métricas de entrenamiento y finanzas..." />;
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

  // Mock revenue area curve based on month total
  const ingresosMesNum = Number(data?.ingresosMes || 18500);
  const revenueFlowData = [
    { dia: "Sem 1", monto: Math.round(ingresosMesNum * 0.2) },
    { dia: "Sem 2", monto: Math.round(ingresosMesNum * 0.45) },
    { dia: "Sem 3", monto: Math.round(ingresosMesNum * 0.72) },
    { dia: "Sem 4 (Hoy)", monto: Math.round(ingresosMesNum) },
  ];

  const sociosActivos = Number(data?.sociosActivos || 0);
  const sociosInactivos = Number(data?.sociosInactivos || 0);
  const pieSociosData = [
    { name: "Activos", value: sociosActivos || 1, color: "#10b981" },
    { name: "Inactivos", value: sociosInactivos, color: "#334155" },
  ];

  return (
    <div>
      {/* ====================================================
          FITNESS COACH HERO BANNER (BEHANCE STYLE)
          ==================================================== */}
      <div className="coach-hero-banner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontSize: "11px",
                fontWeight: 800,
                background: "rgba(16, 185, 129, 0.2)",
                color: "var(--color-brand-primary)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Flame size={13} />
              COACH MANAGEMENT HUB
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              • {diaNombre}, {fechaHoyStr}
            </span>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px 0", color: "var(--text-main)" }}>
            ¡A darlo todo hoy, {usuario?.username}! ⚡
          </h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px", maxWidth: "620px" }}>
            Supervisión integral de atletas, flujo de caja, renovaciones de membresía y ocupación de clases en tiempo real.
          </p>
        </div>

        {/* QUICK COACH BUTTONS */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onQuickAction("nuevo-socio")}
            style={{ fontWeight: 700 }}
          >
            <UserPlus size={16} />
            + Registrar Socio
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onQuickAction("pase-diario")}
            style={{
              borderColor: "rgba(16, 185, 129, 0.4)",
              color: "var(--color-brand-primary)",
              fontWeight: 700,
            }}
          >
            <Ticket size={16} />
            + Pase Diario
          </button>
        </div>
      </div>

      {/* ====================================================
          QUICK COACH ACTION CARDS
          ==================================================== */}
      <div className="coach-actions-grid">
        <div
          className="coach-action-card"
          onClick={() => onQuickAction("pase-diario")}
        >
          <div className="coach-action-icon neon-green">
            <Ticket size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>Pase Diario</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Acceso por 1 día</div>
          </div>
        </div>

        <div
          className="coach-action-card"
          onClick={() => onQuickAction("nuevo-socio")}
        >
          <div className="coach-action-icon neon-blue">
            <UserPlus size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>Nuevo Socio</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Ficha & membresía</div>
          </div>
        </div>

        <div
          className="coach-action-card"
          onClick={() => onNavigate("clases")}
        >
          <div className="coach-action-icon neon-orange">
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>Check-in Clases</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Asistencia de hoy</div>
          </div>
        </div>

        <div
          className="coach-action-card"
          onClick={() => onNavigate("empleados")}
        >
          <div className="coach-action-icon neon-purple">
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>Rotación Sedes</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Asignar personal</div>
          </div>
        </div>
      </div>

      {/* ====================================================
          EXPIRING SOON WARNING
          ==================================================== */}
      {porVencer.length > 0 && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--radius-md)",
                background: "rgba(245, 158, 11, 0.2)",
                color: "#fbbf24",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <strong style={{ color: "#fbbf24", fontSize: "14.5px" }}>
                {porVencer.length} membresía(s) vencen en los próximos 7 días
              </strong>
              <div style={{ color: "var(--text-secondary)", fontSize: "12.5px", marginTop: "2px" }}>
                Contacta a los socios para renovar y no interrumpir su plan de entrenamiento físico.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-warning btn-sm"
            onClick={() => onNavigate("suscripciones")}
          >
            Gestionar Renovaciones
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
          subtitle={`+${data?.sociosInactivos || 0} inactivos`}
          icon={Users}
          color="green"
          onClick={() => onNavigate("socios")}
        />

        <StatCard
          title="Membresías Vigentes"
          value={data?.suscripcionesActivas || 0}
          subtitle={`${data?.suscripcionesPorVencer7Dias || 0} por vencer pronto`}
          icon={CreditCard}
          color="amber"
          onClick={() => onNavigate("suscripciones")}
        />

        <StatCard
          title="Ingresos del Mes"
          value={formatCurrency(data?.ingresosMes)}
          subtitle={`Hoy: ${formatCurrency(data?.ingresosHoy)}`}
          icon={Banknote}
          color="blue"
          onClick={() => onNavigate("caja")}
        />

        <StatCard
          title="Sesiones Grupales"
          value={data?.clasesActivas || 0}
          subtitle={`En ${data?.sedesActivas || 0} sedes activas`}
          icon={Dumbbell}
          color="purple"
          onClick={() => onNavigate("clases")}
        />
      </div>

      {/* ====================================================
          SCHEDULE OF TODAY & CHARTS
          ==================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        {/* TODAY'S CLASSES & COACH CHECK-IN */}
        <div className="card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} style={{ color: "var(--color-accent)" }} />
                Sesiones de Hoy ({diaNombre})
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {clasesHoy.length > 0 ? `${clasesHoy.length} clase(s) programada(s)` : "Sin clases hoy"}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate("clases")}
            >
              Ver calendario completo <ArrowRight size={13} />
            </button>
          </div>

          {clasesHoy.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 12px", color: "var(--text-muted)" }}>
              <Calendar size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
              <p style={{ margin: 0, fontSize: "13px" }}>No hay sesiones grupales asignadas para este día.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {clasesHoy.map((clase) => (
                <div
                  key={clase.id}
                  style={{
                    background: "var(--bg-surface-elevated, #162032)",
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
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>
                      {clase.nombre}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "10px", marginTop: "2px" }}>
                      <span>🕒 {clase.horaInicio} - {clase.horaFin}</span>
                      <span>👤 Coach: {clase.instructorNombre || "Staff"}</span>
                      <span>📍 {clase.sedeNombre || "Sede"}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenAsistencia(clase)}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <UserCheck size={14} />
                    Tomar Asistencia
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FINANCIAL REVENUE FLOW (NEON GRADIENT AREA) */}
        <div className="card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Flujo Financiero (Mes)</h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Total acumulado: <strong>{formatCurrency(data?.ingresosMes)}</strong>
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate("reportes")}
            >
              Reportes <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ width: "100%", height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="neonGreenFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `S/${v}`} />
                <Tooltip
                  formatter={(value) => [`S/ ${Number(value).toLocaleString("es-PE")}`, "Ingresos"]}
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
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#neonGreenFlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CLIENT RETENTION DONUT (FITNESS ATHLETES) */}
        <div className="card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Retención de Atletas</h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {sociosActivos} activos / {sociosInactivos} inactivos
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate("socios")}
            >
              Socios <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ width: "100%", height: 210, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieSociosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
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
              Sesión de <strong>{claseSeleccionada?.horaInicio} a {claseSeleccionada?.horaFin}</strong> • Coach: {claseSeleccionada?.instructorNombre}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-brand-primary)", fontWeight: 600, marginTop: "2px" }}>
              Fecha: {fechaHoyStr}
            </div>
          </div>
          <Badge variant="purple">
            {inscritosClase.length} de {claseSeleccionada?.cupoMax || 20} cupos
          </Badge>
        </div>

        {loadingInscritos ? (
          <LoadingSpinner text="Cargando atletas inscritos en esta clase..." />
        ) : inscritosClase.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "13.5px" }}>Aún no hay atletas inscritos en esta sesión.</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
              Inscribe socios desde la pantalla de Clases y Horarios.
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: "360px", overflowY: "auto", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>
            {inscritosClase.map((inscripcion) => (
              <div key={inscripcion.id} className="attendance-row">
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-main)" }}>
                    {inscripcion.socioNombre || `Socio #${inscripcion.socioId}`}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Inscripción #{inscripcion.id} • DNI: {inscripcion.socioDni || "—"}
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
