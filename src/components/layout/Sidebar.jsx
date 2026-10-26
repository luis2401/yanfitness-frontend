import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Building2,
  Dumbbell,
  Receipt,
  Calendar,
  Briefcase,
  ShieldCheck,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";

const Sidebar = ({ activeTab, onSelectTab, isOpen, onCloseMobile, kpis }) => {
  const { usuario, isAdmin, logout } = useAuth();

  const navItems = [
    {
      id: "dashboard",
      label: "Panel Principal",
      icon: LayoutDashboard,
      roles: ["ALL"],
    },
    {
      id: "socios",
      label: "Gestión de Socios",
      icon: Users,
      badge: kpis?.sociosActivos,
      roles: ["ALL"],
    },
    {
      id: "suscripciones",
      label: "Suscripciones",
      icon: CreditCard,
      badge: kpis?.suscripcionesPorVencer7Dias ? `${kpis.suscripcionesPorVencer7Dias} por vencer` : null,
      roles: ["ALL"],
    },
    {
      id: "caja",
      label: "Caja y Pagos",
      icon: Receipt,
      roles: ["ALL"],
    },
    {
      id: "clases",
      label: "Clases y Horarios",
      icon: Calendar,
      roles: ["ALL"],
    },
    {
      id: "sedes",
      label: "Sedes y Locales",
      icon: Building2,
      roles: ["ALL"],
    },
    {
      id: "planes",
      label: "Planes y Tarifas",
      icon: Dumbbell,
      roles: ["ALL"],
    },
    // Admin Only
    {
      id: "empleados",
      label: "Personal / Staff",
      icon: Briefcase,
      roles: ["ADMIN"],
    },
    {
      id: "usuarios",
      label: "Usuarios del Sistema",
      icon: ShieldCheck,
      roles: ["ADMIN"],
    },
    {
      id: "reportes",
      label: "Reportes Ejecutivos",
      icon: BarChart3,
      roles: ["ADMIN"],
    },
  ];

  const filteredNav = navItems.filter(
    (item) => item.roles.includes("ALL") || (item.roles.includes("ADMIN") && isAdmin)
  );

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* BRAND HEADER */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <span>YF</span>
            </div>
            <div className="brand-details">
              <span className="brand-title">YANFITNESS</span>
              <span className="brand-subtitle">Gestión de Gimnasio</span>
            </div>
          </div>
          <button
            className="btn-icon mobile-menu-btn"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="sidebar-nav">
          <span className="sidebar-section-title">Navegación</span>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
              >
                <div className="sidebar-item-left">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* FOOTER USER CARD */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-circle">
              {usuario?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-username">{usuario?.username}</div>
              <div className="sidebar-user-role">
                {isAdmin ? "Administrador" : usuario?.rol || "Colaborador"}
              </div>
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={logout}
              title="Cerrar Sesión"
              style={{ color: "#ef4444" }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
