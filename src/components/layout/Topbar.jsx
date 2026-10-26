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
    dashboard: { title: "Resumen Operativo", subtitle: "Estado general de membresías, asistencia y recaudación" },
    socios: { title: "Directorio de Socios", subtitle: "Padrón de miembros registrados y estado de cuenta" },
    suscripciones: { title: "Membresías", subtitle: "Control de vigencias, renovaciones y accesos por sede" },
    caja: { title: "Caja y Pagos", subtitle: "Registro de cobros, pases diarios y arqueo de turno" },
    clases: { title: "Clases y Horarios", subtitle: "Programación semanal, cupos y lista de asistencia" },
    sedes: { title: "Sedes y Locales", subtitle: "Administración de locales activos" },
    planes: { title: "Planes y Tarifas", subtitle: "Catálogo de planes vigentes y tarifas por sede" },
    empleados: { title: "Personal y Turnos", subtitle: "Instructores, recepción y asignación por sede" },
    usuarios: { title: "Usuarios del Sistema", subtitle: "Cuentas de acceso, permisos y sesiones" },
    reportes: { title: "Reportes", subtitle: "Indicadores financieros, retención y ocupación" },
  };

  const currentInfo = titles[activeTab] || { title: "Panel de Gestión", subtitle: "Administración del gimnasio" };
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
          <h1>{currentInfo.title}</h1>
          <div className="topbar-breadcrumb">
            <span>Yanahuara Fitness</span>
            <span>·</span>
            <span>{currentInfo.subtitle}</span>
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
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-light)",
              fontSize: "12.5px",
              color: "var(--text-main)",
            }}
            title="Sede activa en el turno actual"
          >
            <MapPin size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-muted)", fontSize: "11.5px", fontWeight: 500 }}>Sede:</span>
            <select
              value={sedeTurno?.id || ""}
              onChange={(e) => {
                const sel = sedesList.find((s) => String(s.id) === String(e.target.value));
                if (sel) {
                  setSedeTurno(sel);
                  showToast(`Sede activa: ${sel.nombre}`, "info");
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-main)",
                fontWeight: 600,
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

        {/* SECONDARY QUICK ACTION: PASE DIARIO */}
        <button
          type="button"
          className="quick-action-btn"
          onClick={() => onQuickAction("pase-diario")}
          title="Registrar pase diario para visitante"
        >
          <Ticket size={15} />
          <span>Pase Diario</span>
        </button>

        {/* PRIMARY QUICK ACTION: NUEVO SOCIO */}
        <button
          type="button"
          className="quick-action-btn primary-accent"
          onClick={() => onQuickAction("nuevo-socio")}
          title="Registrar nuevo socio"
        >
          <UserPlus size={15} />
          <span>Nuevo Socio</span>
        </button>

        {/* THEME TOGGLE */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? (
            <Sun size={17} style={{ color: "var(--text-secondary)" }} />
          ) : (
            <Moon size={17} style={{ color: "var(--text-secondary)" }} />
          )}
        </button>

        {/* NOTIFICATIONS BELL */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            type="button"
            className="btn-icon-circle"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notificaciones y alertas"
            aria-label="Notificaciones"
          >
            <Bell size={17} />
            {suscripcionesVenciendo > 0 && <span className="badge-dot" />}
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "44px",
                width: "310px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--border-light)",
                padding: "16px",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13.5px",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "var(--text-main)",
                }}
              >
                <span>Vencimientos próximos</span>
                <span className="badge badge-warning">
                  {suscripcionesVenciendo}
                </span>
              </div>

              {suscripcionesVenciendo > 0 ? (
                <div
                  style={{
                    padding: "12px",
                    background: "var(--bg-surface-elevated)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    fontSize: "13px",
                    color: "var(--text-main)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--color-warning)" }}>
                    {suscripcionesVenciendo} membresía(s) por vencer
                  </p>
                  <p style={{ margin: "4px 0 12px 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Finalizan dentro de los próximos 7 días.
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateToTab("suscripciones");
                    }}
                  >
                    Revisar membresías
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                  No hay membresías próximas a vencer esta semana.
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
                top: "44px",
                width: "220px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--border-light)",
                padding: "8px",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: "8px 12px 10px",
                  borderBottom: "1px solid var(--border-light)",
                  marginBottom: "6px",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-main)" }}>
                  {usuario?.username}
                </div>
                <div
                  style={{
                    fontSize: "11.5px",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    marginTop: "2px",
                  }}
                >
                  {isAdmin ? "Administrador" : usuario?.rol || "Recepción"}
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
