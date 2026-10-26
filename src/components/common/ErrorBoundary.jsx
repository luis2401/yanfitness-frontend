import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            background: "var(--bg-surface, #121927)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "var(--color-danger-bg)",
              color: "var(--color-danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <AlertTriangle size={30} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)", margin: "0 0 8px 0" }}>
            Ocurrió un problema al cargar esta vista
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "460px", margin: "0 0 20px 0" }}>
            {this.state.error?.message || "Error inesperado en los componentes de la interfaz."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReset}
          >
            <RotateCcw size={16} />
            Recargar Vista
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
