import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Login from "./componentes/Login";
import Dashboard from "./pantallas/Dashboard";
import Socios from "./pantallas/Socios";
import Suscripciones from "./pantallas/Suscripciones";
import CajaPagos from "./pantallas/CajaPagos";
import Clases from "./pantallas/Clases";
import Sedes from "./pantallas/Sedes";
import Planes from "./pantallas/Planes";
import Empleados from "./pantallas/Empleados";
import Usuarios from "./pantallas/Usuarios";
import Reportes from "./pantallas/Reportes";
import NotFound from "./pantallas/NotFound";
import FormularioSocioModal from "./components/socios/FormularioSocioModal";
import FormularioPaseDiarioModal from "./components/pagos/FormularioPaseDiarioModal";
import FormularioSuscripcionModal from "./components/suscripciones/FormularioSuscripcionModal";
import "./App.css";

const VALID_ROUTES = [
  "dashboard",
  "socios",
  "suscripciones",
  "caja",
  "clases",
  "sedes",
  "planes",
  "empleados",
  "usuarios",
  "reportes",
];

const getRouteFromUrl = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!path || path === "index.html") return "dashboard";
  if (VALID_ROUTES.includes(path)) return path;
  return "404";
};

function AppContent() {
  const { usuario, isAdmin, login } = useAuth();
  const [pantallaActual, setPantallaActual] = useState(getRouteFromUrl);

  // Global Quick Action Modals
  const [quickSocioModal, setQuickSocioModal] = useState(false);
  const [quickPaseModal, setQuickPaseModal] = useState(false);
  const [quickSubModal, setQuickSubModal] = useState(false);
  const [nuevoSocioCreado, setNuevoSocioCreado] = useState(null);

  // Sync browser popstate (back / forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setPantallaActual(getRouteFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const cambiarPantalla = useCallback((tab) => {
    if (tab === "dashboard") {
      window.history.pushState({}, "", "/");
    } else if (VALID_ROUTES.includes(tab)) {
      window.history.pushState({}, "", `/${tab}`);
    }
    setPantallaActual(tab);
  }, []);

  // Handle 404 Route for non-authenticated and authenticated users
  if (pantallaActual === "404") {
    return <NotFound onResetRoute={cambiarPantalla} />;
  }

  // If not authenticated, render Login
  if (!usuario) {
    return (
      <Login
        onLogin={(datosUsuario) => {
          login(datosUsuario, true);
          cambiarPantalla("dashboard");
        }}
      />
    );
  }

  const handleQuickAction = (action) => {
    if (action === "nuevo-socio") {
      setQuickSocioModal(true);
    } else if (action === "pase-diario") {
      setQuickPaseModal(true);
    }
  };

  const renderPantalla = () => {
    switch (pantallaActual) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={cambiarPantalla}
            onQuickAction={handleQuickAction}
          />
        );
      case "socios":
        return <Socios />;
      case "suscripciones":
        return <Suscripciones />;
      case "caja":
        return <CajaPagos />;
      case "clases":
        return <Clases />;
      case "sedes":
        return <Sedes />;
      case "planes":
        return <Planes />;
      case "empleados":
        return isAdmin ? <Empleados /> : <Dashboard onNavigate={cambiarPantalla} onQuickAction={handleQuickAction} />;
      case "usuarios":
        return isAdmin ? <Usuarios /> : <Dashboard onNavigate={cambiarPantalla} onQuickAction={handleQuickAction} />;
      case "reportes":
        return isAdmin ? <Reportes /> : <Dashboard onNavigate={cambiarPantalla} onQuickAction={handleQuickAction} />;
      default:
        return <NotFound onResetRoute={cambiarPantalla} />;
    }
  };

  return (
    <Layout
      activeTab={pantallaActual}
      onSelectTab={cambiarPantalla}
    >
      {renderPantalla()}

      {/* QUICK ACTION: NUEVO SOCIO */}
      {quickSocioModal && (
        <FormularioSocioModal
          isOpen={quickSocioModal}
          onClose={() => setQuickSocioModal(false)}
          onSuccess={(socio) => {
            setQuickSocioModal(false);
            if (socio) {
              setNuevoSocioCreado(socio);
              setQuickSubModal(true);
            } else {
              cambiarPantalla("socios");
            }
          }}
        />
      )}

      {/* QUICK ACTION: ASIGNAR MEMBRESÍA TRAS CREAR SOCIO */}
      {quickSubModal && (
        <FormularioSuscripcionModal
          isOpen={quickSubModal}
          socioPreseleccionado={nuevoSocioCreado}
          onClose={() => {
            setQuickSubModal(false);
            cambiarPantalla("socios");
          }}
          onSuccess={() => {
            setQuickSubModal(false);
            cambiarPantalla("suscripciones");
          }}
          onSwitchToPaseDiario={(socioObj) => {
            setQuickSubModal(false);
            setNuevoSocioCreado(socioObj);
            setQuickPaseModal(true);
          }}
        />
      )}

      {/* QUICK ACTION: PASE DIARIO */}
      {quickPaseModal && (
        <FormularioPaseDiarioModal
          isOpen={quickPaseModal}
          socioPreseleccionado={nuevoSocioCreado}
          onClose={() => {
            setQuickPaseModal(false);
            setNuevoSocioCreado(null);
          }}
          onSuccess={() => {
            setQuickPaseModal(false);
            setNuevoSocioCreado(null);
            cambiarPantalla("caja");
          }}
        />
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
