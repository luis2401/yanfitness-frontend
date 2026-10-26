import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  UserPlus,
  Ticket,
  Bell,
  LogOut,
  ChevronDown,
  Shield,
  Sun,
  Moon,
  Sparkles,
  MapPin,
} from "lucide-react";

const Topbar = ({
  activeTab,
  onOpenMobile,
  onQuickAction,
  kpis,
  onNavigateToTab,
}) => {
  const { usuario, isAdmin, logout, sedeTurno, setSedeTurno, sedesList, showToast } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Theme management: default to dark (Fitness Luxury)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("gym_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gym_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const titles = {
    dashboard: { title: "Fitness Hub & Métricas", subtitle: "Seguimiento en tiempo real, entrenamientos y finanzas" },
    socios: { title: "Clientes & Socios", subtitle: "Directorio de atletas, membresías activas y fichas" },
    suscripciones: { title: "Membresías & Contratos", subtitle: "Control de vigencias, renovaciones y accesos multisede" },
    caja: { title: "Caja & Pagos", subtitle: "Cobro de cuotas, pases diarios y comprobantes" },
    clases: { title: "Clases & Calendario Coach", subtitle: "Horarios semanales, cupos y control de asistencia" },
    sedes: { title: "Sedes & Centros", subtitle: "Administración de sedes e infraestructura" },
    planes: { title: "Planes & Tarifas", subtitle: "Catálogo de membresías y precios diferenciados por sede" },
    empleados: { title: "Coaches & Personal", subtitle: "Entrenadores, recepcionistas y rotación entre sedes" },
    usuarios: { title: "Seguridad & Accesos", subtitle: "Usuarios del sistema, bloqueo y sesiones activas" },
    reportes: { title: "Reportes & Analíticas", subtitle: "Gráficos de ingresos, volumen de socios y ocupación" },
  };

  const currentInfo = titles[activeTab] || { title: "FITNESS COACH", subtitle: "Sistema de gestión deportiva" };
  const suscripcionesVenciendo = kpis?.suscripcionesPorVencer7Dias || 0;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobile}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-title-block">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1>{currentInfo.title}</h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: "rgba(16, 185, 129, 0.15)",
                color: "var(--color-brand-primary)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              PRO COACH
            </span>
          </div>
          <div className="topbar-breadcrumb">
            <span>YAN FITNESS</span>
            <span>/</span>
            <span style={{ color: "var(--color-brand-primary)", fontWeight: 600 }}>
              {currentInfo.title}
            </span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* SEDE DE TURNO SELECTOR */}
        {sedesList?.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-surface-elevated, #182236)",
              border: "1px solid var(--border-light)",
              fontSize: "12.5px",
              color: "var(--text-main)",
            }}
            title="Sede donde estás laborando en tu turno de hoy"
          >
            <MapPin size={15} style={{ color: "var(--color-brand-primary)" }} />
            <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700 }}>TURNO:</span>
            <select
              value={sedeTurno?.id || ""}
              onChange={(e) => {
                const sel = sedesList.find((s) => String(s.id) === String(e.target.value));
                if (sel) {
                  setSedeTurno(sel);
                  showToast(`Sede de turno activa: ${sel.nombre}`, "info");
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-brand-primary)",
                fontWeight: 700,
                fontSize: "12.5px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {sedesList.map((s) => (
                <option key={s.id} value={s.id} style={{ background: "var(--bg-surface)", color: "var(--text-main)" }}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* QUICK ACTION: NUEVO SOCIO */}
        <button
          type="button"
          className="quick-action-btn"
          onClick={() => onQuickAction("nuevo-socio")}
          title="Registrar nuevo socio"
        >
          <UserPlus size={16} />
          <span>+ Nuevo Socio</span>
        </button>

        {/* QUICK ACTION: PASE DIARIO */}
        <button
          type="button"
          className="quick-action-btn"
          onClick={() => onQuickAction("pase-diario")}
          title="Registrar pase diario para visitante"
          style={{
            background: "rgba(16, 185, 129, 0.14)",
            color: "var(--color-brand-primary)",
            borderColor: "rgba(16, 185, 129, 0.35)",
          }}
        >
          <Ticket size={16} />
          <span>+ Pase Diario</span>
        </button>

        {/* THEME TOGGLE (DARK FITNESS / CLEAN LIGHT) */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo Claro" : "Cambiar a modo Oscuro Fitness"}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? (
            <Sun size={18} style={{ color: "#fbbf24" }} />
          ) : (
            <Moon size={18} style={{ color: "var(--color-brand-primary)" }} />
          )}
        </button>

        {/* NOTIFICATIONS BELL */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            type="button"
            className="btn-icon-circle"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notificaciones y Alertas"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            {suscripcionesVenciendo > 0 && <span className="badge-dot" />}
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "46px",
                width: "320px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--border-light)",
                padding: "16px",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "var(--text-main)",
                }}
              >
                <span>Alertas de Membresías</span>
                <span className="badge badge-warning">
                  {suscripcionesVenciendo} aviso(s)
                </span>
              </div>

              {suscripcionesVenciendo > 0 ? (
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(245, 158, 11, 0.12)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    fontSize: "13px",
                    color: "var(--text-main)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, color: "#fbbf24" }}>
                    {suscripcionesVenciendo} socio(s) por vencer
                  </p>
                  <p style={{ margin: "4px 0 10px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Finalizan en los próximos 7 días. Conviene gestionar renovación para no perder ritmo de entrenamiento.
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateToTab("suscripciones");
                    }}
                  >
                    Ver membresías por vencer
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                  ¡Todo al día! No hay clientes con membresía próxima a caducar.
                </p>
              )}
            </div>
          )}
        </div>

        {/* USER PROFILE PILL */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <div
            className="user-profile-pill"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          >
            <div className="user-pill-avatar">
              {usuario?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="user-pill-text">{usuario?.username}</span>
            <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
          </div>

          {userDropdownOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "46px",
                width: "230px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--border-light)",
                padding: "8px",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border-light)",
                  marginBottom: "6px",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>
                  {usuario?.username}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-brand-primary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Sparkles size={12} />
                  {isAdmin ? "Rol: Administrador" : `Rol: ${usuario?.rol || "Staff"}`}
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  className="sidebar-item"
                  style={{ color: "var(--text-main)", padding: "8px 12px" }}
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onNavigateToTab("usuarios");
                  }}
                >
                  <Shield size={16} />
                  <span>Usuarios y Seguridad</span>
                </button>
              )}

              <button
                type="button"
                className="sidebar-item"
                style={{ color: "#ef4444", padding: "8px 12px" }}
                onClick={() => {
                  setUserDropdownOpen(false);
                  logout();
                }}
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
