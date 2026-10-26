import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../api/apiClient";
import FormularioSocioModal from "../socios/FormularioSocioModal";
import FormularioPaseDiarioModal from "../pagos/FormularioPaseDiarioModal";
import ErrorBoundary from "../common/ErrorBoundary";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const Layout = ({ activeTab, onSelectTab, children }) => {
  const { toasts, removeToast } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kpis, setKpis] = useState(null);

  // Quick Action Modals
  const [modalQuickSocio, setModalQuickSocio] = useState(false);
  const [modalQuickPase, setModalQuickPase] = useState(false);

  const fetchKpis = useCallback(async () => {
    try {
      const data = await dashboardService.getDashboard();
      setKpis(data);
    } catch {
      // In case user is not authorized or backend sleeping
    }
  }, []);

  useEffect(() => {
    fetchKpis();
    // Refresh every 60s
    const timer = setInterval(fetchKpis, 60000);
    return () => clearInterval(timer);
  }, [fetchKpis]);

  const handleQuickAction = (action) => {
    if (action === "nuevo-socio") {
      setModalQuickSocio(true);
    } else if (action === "pase-diario") {
      setModalQuickPase(true);
    }
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        kpis={kpis}
      />

      {/* MAIN VIEWPORT */}
      <div className="main-viewport">
        <Topbar
          activeTab={activeTab}
          onOpenMobile={() => setMobileMenuOpen(true)}
          onQuickAction={handleQuickAction}
          kpis={kpis}
          onNavigateToTab={onSelectTab}
        />

        <main className="content-area">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* GLOBAL TOAST NOTIFICATIONS */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isError = toast.type === "error";
            return (
              <div key={toast.id} className={`toast toast-${toast.type}`}>
                {isSuccess && <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />}
                {isError && <AlertCircle size={18} style={{ color: "var(--color-danger)" }} />}
                {!isSuccess && !isError && <Info size={18} style={{ color: "var(--color-brand-primary)" }} />}
                <span style={{ flex: 1 }}>{toast.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK ACTION MODALS */}
      {modalQuickSocio && (
        <FormularioSocioModal
          isOpen={modalQuickSocio}
          onClose={() => setModalQuickSocio(false)}
          onSuccess={() => {
            setModalQuickSocio(false);
            fetchKpis();
          }}
        />
      )}

      {modalQuickPase && (
        <FormularioPaseDiarioModal
          isOpen={modalQuickPase}
          onClose={() => setModalQuickPase(false)}
          onSuccess={() => {
            setModalQuickPase(false);
            fetchKpis();
          }}
        />
      )}
    </div>
  );
};

export default Layout;
