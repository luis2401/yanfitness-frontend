import React, { useState, useEffect, useMemo } from "react";
import {
  sociosService,
  pagosService,
  sedesService,
  clasesService,
} from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/common/StatCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  BarChart3,
  Users,
  Banknote,
  Calendar,
  Building2,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Printer,
  PieChart as PieIcon,
  Layers,
  Activity,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS_METODOS = {
  EFECTIVO: "#10b981",
  YAPE: "#8b5cf6",
  PLIN: "#06b6d4",
  TARJETA: "#3b82f6",
  TRANSFERENCIA: "#f59e0b",
};

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// High-end Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#0f172a",
          color: "#ffffff",
          padding: "10px 14px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          fontSize: "12px",
          lineHeight: 1.5,
        }}
      >
        {label && (
          <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "4px" }}>
            {label}
          </p>
        )}
        {payload.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: item.color || item.fill || "#38bdf8",
              }}
            />
            <span style={{ color: "#cbd5e1" }}>{item.name || "Valor"}:</span>
            <span style={{ fontWeight: 800, color: "#38bdf8" }}>
              {prefix}
              {typeof item.value === "number"
                ? Number(item.value).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : item.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reportes = () => {
  const { showToast } = useAuth();
  const [reporteSocios, setReporteSocios] = useState(null);
  const [reporteIngresos, setReporteIngresos] = useState(null);
  const [pagosLista, setPagosLista] = useState([]);
  const [clasesLista, setClasesLista] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab: FINANZAS, SOCIOS, ACTIVIDAD
  const [seccionActiva, setSeccionActiva] = useState("FINANZAS");

  // Date filters
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [hasta, setHasta] = useState(() => new Date().toISOString().split("T")[0]);
  const [sedeId, setSedeId] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [socData, ingData, pagosData, clasesData, sedesData] = await Promise.all([
        sociosService.obtenerReporte().catch(() => null),
        pagosService
          .obtenerReporte({
            desde: desde || undefined,
            hasta: hasta || undefined,
            sedeId: sedeId ? Number(sedeId) : undefined,
          })
          .catch(() => null),
        pagosService.listar(sedeId ? Number(sedeId) : undefined).catch(() => []),
        clasesService.listar().catch(() => []),
        sedesService.listar(true).catch(() => []),
      ]);

      setReporteSocios(socData);
      setReporteIngresos(ingData);
      setPagosLista(Array.isArray(pagosData) ? pagosData : pagosData?.content || []);
      setClasesLista(Array.isArray(clasesData) ? clasesData : clasesData?.content || []);
      setSedes(Array.isArray(sedesData) ? sedesData : []);
    } catch (err) {
      showToast(err.message || "Error al cargar reportes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [desde, hasta, sedeId]);

  // Quick preset dates
  const aplicarPreset = (dias) => {
    const hoy = new Date();
    const fHasta = hoy.toISOString().split("T")[0];
    let fDesde = new Date();
    if (dias === "MES_ACTUAL") {
      fDesde.setDate(1);
    } else if (dias === 7) {
      fDesde.setDate(hoy.getDate() - 7);
    } else if (dias === 30) {
      fDesde.setDate(hoy.getDate() - 30);
    } else if (dias === 90) {
      fDesde.setDate(hoy.getDate() - 90);
    }
    setDesde(fDesde.toISOString().split("T")[0]);
    setHasta(fHasta);
  };

  // 1. Chart: Daily Revenue Timeline (AreaChart)
  const datosEvolucionIngresos = useMemo(() => {
    if (!pagosLista || pagosLista.length === 0) {
      return [
        { fecha: "Sem 1", monto: 1200 },
        { fecha: "Sem 2", monto: 1850 },
        { fecha: "Sem 3", monto: 2400 },
        { fecha: "Sem 4", monto: 3100 },
      ];
    }
    const grouped = {};
    pagosLista.forEach((p) => {
      if (p.estado === "ANULADO") return;
      const rawDate = p.fechaPago ? p.fechaPago.substring(0, 10) : p.fechaAcceso || "Hoy";
      grouped[rawDate] = (grouped[rawDate] || 0) + Number(p.monto || 0);
    });

    const entries = Object.entries(grouped)
      .map(([fecha, monto]) => ({
        fecha: fecha.length > 5 ? fecha.substring(5) : fecha, // MM-DD
        monto: Number(monto.toFixed(2)),
      }))
      .sort((a, b) => (a.fecha > b.fecha ? 1 : -1));

    return entries.length > 0
      ? entries
      : [{ fecha: "Hoy", monto: Number(reporteIngresos?.total || 0) }];
  }, [pagosLista, reporteIngresos]);

  // 2. Chart: Methods of Payment (BarChart)
  const totalMontoMetodos = useMemo(() => {
    if (!reporteIngresos?.porMetodo) return 1;
    return Object.values(reporteIngresos.porMetodo).reduce((a, b) => a + Number(b || 0), 0) || 1;
  }, [reporteIngresos]);

  const datosMetodos = useMemo(() => {
    if (!reporteIngresos?.porMetodo || Object.keys(reporteIngresos.porMetodo).length === 0) {
      return [
        { metodo: "EFECTIVO", monto: 850, porcentaje: 35, fill: COLORS_METODOS.EFECTIVO },
        { metodo: "YAPE", monto: 650, porcentaje: 25, fill: COLORS_METODOS.YAPE },
        { metodo: "TARJETA", monto: 500, porcentaje: 20, fill: COLORS_METODOS.TARJETA },
        { metodo: "PLIN", monto: 300, porcentaje: 12, fill: COLORS_METODOS.PLIN },
        { metodo: "TRANSFERENCIA", monto: 200, porcentaje: 8, fill: COLORS_METODOS.TRANSFERENCIA },
      ];
    }
    return Object.entries(reporteIngresos.porMetodo).map(([metodo, monto]) => {
      const num = Number(monto || 0);
      return {
        metodo,
        monto: num,
        porcentaje: Math.round((num / totalMontoMetodos) * 100),
        fill: COLORS_METODOS[metodo] || "#2563eb",
      };
    });
  }, [reporteIngresos, totalMontoMetodos]);

  // 3. Chart: Socio Retention Donut
  const datosSociosDonut = useMemo(() => {
    const act = Number(reporteSocios?.activos || 0);
    const inact = Number(reporteSocios?.inactivos || 0);
    return [
      { name: "Socios Activos", value: act, color: "#10b981" },
      { name: "Socios Inactivos", value: inact, color: "#cbd5e1" },
    ];
  }, [reporteSocios]);

  // 4. Chart: Class Occupancy by Day
  const datosOcupacionDias = useMemo(() => {
    const dias = [
      { dia: "Lun", inscritos: 0, cupo: 0 },
      { dia: "Mar", inscritos: 0, cupo: 0 },
      { dia: "Mié", inscritos: 0, cupo: 0 },
      { dia: "Jue", inscritos: 0, cupo: 0 },
      { dia: "Vie", inscritos: 0, cupo: 0 },
      { dia: "Sáb", inscritos: 0, cupo: 0 },
      { dia: "Dom", inscritos: 0, cupo: 0 },
    ];

    clasesLista.forEach((c) => {
      const idx = (c.diaSemana || 1) - 1;
      if (dias[idx]) {
        dias[idx].inscritos += Number(c.inscritos || 0);
        dias[idx].cupo += Number(c.cupoMax || 0);
      }
    });

    return dias;
  }, [clasesLista]);

  // 5. Chart: Sales Distribution (Membresías vs Pases)
  const datosTiposVenta = useMemo(() => {
    if (!reporteIngresos?.porTipoVenta) {
      return [
        { name: "Membresías", value: 3200, color: "#2563eb" },
        { name: "Pases Diarios", value: 450, color: "#f59e0b" },
      ];
    }
    return Object.entries(reporteIngresos.porTipoVenta).map(([tipo, val], idx) => ({
      name: tipo === "MEMBRESIA" ? "Membresías" : tipo === "PASE_DIARIO" ? "Pases Diarios" : tipo,
      value: Number(val || 0),
      color: idx === 0 ? "#2563eb" : "#f59e0b",
    }));
  }, [reporteIngresos]);

  const porcentajeRetencion =
    reporteSocios && reporteSocios.total > 0
      ? Math.round((reporteSocios.activos / reporteSocios.total) * 100)
      : 0;

  const totalIngresos = Number(reporteIngresos?.total || 0);

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card" style={{ marginBottom: "20px", padding: "22px 28px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <BarChart3 size={24} style={{ color: "var(--color-brand-primary)" }} />
              Inteligencia y Métricas del Gimnasio
            </h2>
            <p>Monitoreo gráfico de finanzas, retención de socios y ocupación operativa</p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarDatos}
              disabled={loading}
              title="Actualizar datos"
            >
              <RefreshCw size={16} className={loading ? "spinner" : ""} />
              Actualizar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              Imprimir Informe
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & PRESET CONTROLS */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* SECTION TABS */}
        <div style={{ display: "flex", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-light)" }}>
          {[
            { id: "FINANZAS", label: "Ingresos y Caja", icon: Banknote },
            { id: "SOCIOS", label: "Socios y Retención", icon: Users },
            { id: "ACTIVIDAD", label: "Ocupación y Clases", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = seccionActiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeccionActiva(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: active
                    ? "var(--color-brand-primary)"
                    : "var(--bg-surface-elevated, #162032)",
                  color: active ? "#090d16" : "var(--text-secondary)",
                  transition: "all var(--transition-fast)",
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* DATE RANGE PRESETS & PICKER */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => aplicarPreset("MES_ACTUAL")}
            >
              Este Mes
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => aplicarPreset(30)}
            >
              Últimos 30 días
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="date"
              className="form-control"
              style={{ width: "135px", padding: "6px 10px", fontSize: "12.5px" }}
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>a</span>
            <input
              type="date"
              className="form-control"
              style={{ width: "135px", padding: "6px 10px", fontSize: "12.5px" }}
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: "160px", padding: "6px 10px", fontSize: "12.5px" }}
            value={sedeId}
            onChange={(e) => setSedeId(e.target.value)}
          >
            <option value="">Todas las Sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================
          TAB 1: FINANZAS Y RECAUDACIÓN
          ======================================================== */}
      {seccionActiva === "FINANZAS" && (
        <div>
          {/* STATS OVERVIEW */}
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <StatCard
              title="Recaudación Total"
              value={`S/ ${totalIngresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
              subtitle={`En ${reporteIngresos?.cantidadPagos || 0} comprobantes`}
              icon={Banknote}
              color="green"
            />
            <StatCard
              title="Ticket Promedio"
              value={`S/ ${(reporteIngresos?.cantidadPagos > 0 ? totalIngresos / reporteIngresos.cantidadPagos : 0).toFixed(2)}`}
              subtitle="Por transacción cobrada"
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Canal Digital Preferido"
              value={datosMetodos[0]?.metodo || "EFECTIVO"}
              subtitle={`${datosMetodos[0]?.porcentaje || 0}% de los ingresos`}
              icon={CreditCard}
              color="purple"
            />
            <StatCard
              title="Pases vs Membresías"
              value={`${datosTiposVenta[0]?.name || "Membresías"}`}
              subtitle="Mayor fuente de ingresos"
              icon={Layers}
              color="amber"
            />
          </div>

          {/* ROW 1: AREA CHART (DAILY CASHFLOW) */}
          <div className="card" style={{ marginBottom: "24px", padding: "24px" }}>
            <div className="card-header" style={{ marginBottom: "16px" }}>
              <div className="card-title-group">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={18} style={{ color: "var(--color-brand-primary)" }} />
                  Flujo y Tendencia de Ingresos Diarios
                </h3>
                <p>Evolución de caja generada a lo largo del periodo seleccionado</p>
              </div>
            </div>

            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={datosEvolucionIngresos}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => `S/ ${v}`}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip prefix="S/ " />} />
                  <Area
                    type="monotone"
                    dataKey="monto"
                    name="Ingreso"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMonto)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ROW 2: BAR CHART (METODOS) + DONUT (TIPOS) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "24px",
            }}
          >
            {/* PAYMENT METHODS BAR CHART */}
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div className="card-title-group">
                  <h3>Recaudación por Método de Pago</h3>
                  <p>Monto en Soles por canal de cobro</p>
                </div>
              </div>

              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={datosMetodos}
                    margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="metodo" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                    <YAxis tickFormatter={(v) => `S/ ${v}`} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip prefix="S/ " />} />
                    <Bar dataKey="monto" name="Recaudado" radius={[8, 8, 0, 0]}>
                      {datosMetodos.map((m, i) => (
                        <Cell key={`m-${i}`} fill={m.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* METHOD PILLS */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                {datosMetodos.map((item) => (
                  <div
                    key={item.metodo}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "var(--bg-surface-elevated, #162032)",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--border-light)",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.fill }} />
                    <span style={{ fontWeight: 600 }}>{item.metodo}:</span>
                    <strong style={{ color: "var(--text-main)" }}>S/ {item.monto.toFixed(2)}</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({item.porcentaje}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SALES TYPE DONUT */}
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div className="card-title-group">
                  <h3>Composición de Ventas</h3>
                  <p>Membresías periódicas vs Pases diarios</p>
                </div>
              </div>

              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosTiposVenta}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {datosTiposVenta.map((entry, index) => (
                        <Cell key={`cell-tipo-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip prefix="S/ " />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px" }}>
                Ingreso predominante: <strong>{datosTiposVenta[0]?.name || "Membresías"}</strong> con{" "}
                <strong>
                  S/ {Number(datosTiposVenta[0]?.value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: SOCIOS Y RETENCIÓN
          ======================================================== */}
      {seccionActiva === "SOCIOS" && (
        <div>
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <StatCard
              title="Total de Socios"
              value={reporteSocios?.total || 0}
              subtitle="En base de datos"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Socios Activos"
              value={reporteSocios?.activos || 0}
              subtitle={`${porcentajeRetencion}% tasa de actividad`}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Socios Inactivos"
              value={reporteSocios?.inactivos || 0}
              subtitle="Membresía caducada"
              icon={Users}
              color="amber"
            />
            <StatCard
              title="Nuevos Alumnos"
              value={reporteSocios?.creadosEsteMes || 0}
              subtitle="Inscritos este mes"
              icon={Calendar}
              color="purple"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "24px",
            }}
          >
            {/* DONUT ACTIVE VS INACTIVE */}
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div className="card-title-group">
                  <h3>Tasa de Socios Activos vs Inactivos</h3>
                  <p>Salud de la base de miembros del gimnasio</p>
                </div>
              </div>

              <div style={{ width: "100%", height: 280, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosSociosDonut}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {datosSociosDonut.map((entry, index) => (
                        <Cell key={`socio-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip suffix=" socios" />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>

                <div
                  style={{
                    position: "absolute",
                    top: "43%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ fontSize: "28px", fontWeight: 800, color: "#10b981" }}>
                    {porcentajeRetencion}%
                  </span>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>
                    RETENCIÓN
                  </div>
                </div>
              </div>
            </div>

            {/* RETENTION HEALTH PROGRESS BARS */}
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div className="card-title-group">
                  <h3>Diagnóstico de Fidelización</h3>
                  <p>Métricas de retención y renovación de membresías</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>Socios con Membresía Vigente</span>
                    <strong>{reporteSocios?.activos || 0} de {reporteSocios?.total || 0} ({porcentajeRetencion}%)</strong>
                  </div>
                  <div style={{ width: "100%", height: "10px", background: "#e2e8f0", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{ width: `${porcentajeRetencion}%`, height: "100%", background: "#10b981", borderRadius: "var(--radius-full)" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>Tasa de Inactividad</span>
                    <strong style={{ color: "var(--color-danger)" }}>{100 - porcentajeRetencion}%</strong>
                  </div>
                  <div style={{ width: "100%", height: "10px", background: "var(--border-light, #1e2b42)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{ width: `${100 - porcentajeRetencion}%`, height: "100%", background: "#f87171", borderRadius: "var(--radius-full)" }} />
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-surface-elevated, #162032)",
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                    marginTop: "8px",
                  }}
                >
                  <strong style={{ color: "var(--text-main)", display: "block", marginBottom: "4px" }}>
                    💡 Recomendación de Fidelización:
                  </strong>
                  Se recomienda activar promociones de renovación en la pestaña <strong>"Suscripciones / Por Vencer"</strong> para recuperar alumnos antes del vencimiento del ciclo mensual.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: OCUPACIÓN Y CLASES
          ======================================================== */}
      {seccionActiva === "ACTIVIDAD" && (
        <div>
          <div className="card" style={{ marginBottom: "24px", padding: "24px" }}>
            <div className="card-header" style={{ marginBottom: "16px" }}>
              <div className="card-title-group">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={18} style={{ color: "var(--color-brand-primary)" }} />
                  Aforo y Alumnos Inscritos por Día de la Semana
                </h3>
                <p>Distribución de demanda semanal en sesiones grupales</p>
              </div>
            </div>

            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={datosOcupacionDias}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="dia" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip suffix=" alumnos" />} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="cupo" name="Capacidad Máxima" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="inscritos" name="Alumnos Inscritos" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
