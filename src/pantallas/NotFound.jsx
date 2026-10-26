import React from "react";
import { Dumbbell, Home, Users, ArrowLeft } from "lucide-react";

const NotFound = ({ onResetRoute }) => {
  const handleGoHome = () => {
    window.history.pushState({}, "", "/");
    if (onResetRoute) onResetRoute("dashboard");
  };

  const handleGoSocios = () => {
    window.history.pushState({}, "", "/");
    if (onResetRoute) onResetRoute("socios");
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          padding: "40px 32px",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-light)",
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        {/* BRAND ICON */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "var(--color-brand-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 24px rgba(16, 185, 129, 0.2)",
          }}
        >
          <Dumbbell size={32} />
        </div>

        {/* 404 GLOWING CODE */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 900,
            lineHeight: 1,
            color: "var(--color-brand-primary)",
            letterSpacing: "-2px",
            marginBottom: "8px",
            textShadow: "0 0 30px rgba(16, 185, 129, 0.35)",
          }}
        >
          404
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 10px 0", color: "var(--text-main)" }}>
          Página No Encontrada
        </h2>

        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 28px 0", lineHeight: 1.5 }}>
          La ruta que has ingresado no existe en el sistema o fue modificada. Verifica el enlace o regresa al panel principal.
        </p>

        {/* ACTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGoHome}
            style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
          >
            <Home size={16} />
            Volver al Panel Principal
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGoSocios}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Users size={16} />
            Ir a Gestión de Socios
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
