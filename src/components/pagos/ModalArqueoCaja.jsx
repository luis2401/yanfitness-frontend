import React from "react";
import Modal from "../common/Modal";
import Badge from "../common/Badge";
import {
  DollarSign,
  Printer,
  Receipt,
  Smartphone,
  CreditCard,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const ModalArqueoCaja = ({ isOpen, onClose, pagos = [], sedeNombre = "Sede Principal", usuario = null }) => {
  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate totals by payment method
  const pagosValidos = pagos.filter((p) => p.estado !== "ANULADO");
  const pagosAnulados = pagos.filter((p) => p.estado === "ANULADO");

  const sumaPorMetodo = {
    EFECTIVO: 0,
    YAPE: 0,
    PLIN: 0,
    TARJETA: 0,
    TARJETA_DEBITO: 0,
    TARJETA_CREDITO: 0,
    TRANSFERENCIA: 0,
    OTRO: 0,
  };

  const conteoPorMetodo = {
    EFECTIVO: 0,
    YAPE: 0,
    PLIN: 0,
    TARJETA: 0,
    TARJETA_DEBITO: 0,
    TARJETA_CREDITO: 0,
    TRANSFERENCIA: 0,
    OTRO: 0,
  };

  // Group by vendor / receptionist
  const ventasPorVendedor = {};

  pagosValidos.forEach((p) => {
    const met = p.metodo || "OTRO";
    const monto = Number(p.monto || 0);
    if (sumaPorMetodo[met] !== undefined) {
      sumaPorMetodo[met] += monto;
      conteoPorMetodo[met] += 1;
    } else {
      sumaPorMetodo.OTRO += monto;
      conteoPorMetodo.OTRO += 1;
    }

    const vendedor = p.vendedorNombre || (usuario?.username ? usuario.username : "Personal de Caja");
    ventasPorVendedor[vendedor] = (ventasPorVendedor[vendedor] || 0) + monto;
  });

  const totalEfectivo = sumaPorMetodo.EFECTIVO;
  const totalBilleteras = sumaPorMetodo.YAPE + sumaPorMetodo.PLIN;
  const totalTarjetas =
    sumaPorMetodo.TARJETA + sumaPorMetodo.TARJETA_DEBITO + sumaPorMetodo.TARJETA_CREDITO;
  const totalTransferencias = sumaPorMetodo.TRANSFERENCIA + sumaPorMetodo.OTRO;
  const totalGeneral = Object.values(sumaPorMetodo).reduce((a, b) => a + b, 0);

  const formatSoles = (n) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arqueo de Turno y Cuadre de Caja"
      size="lg"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Printer size={16} />
            Imprimir Acta de Turno
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Aceptar y Cerrar
          </button>
        </div>
      }
    >
      <div id="print-area">
        {/* SHIFT SUMMARY HEADER */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(0, 210, 255, 0.08) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 size={18} style={{ color: "var(--color-brand-primary)" }} />
              <strong style={{ fontSize: "16px", color: "var(--text-main)" }}>
                {sedeNombre}
              </strong>
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Fecha de Cuadre: <strong style={{ textTransform: "capitalize" }}>{todayStr}</strong>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Responsable en turno: <strong>{usuario?.username || "Recepcionista"}</strong>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Cobrado en Turno
            </span>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "var(--color-brand-primary)",
                letterSpacing: "-0.5px",
                marginTop: "2px",
              }}
            >
              {formatSoles(totalGeneral)}
            </div>
          </div>
        </div>

        {/* BREAKDOWN CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {/* CASH */}
          <div
            style={{
              background: "var(--bg-surface-elevated, #162032)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-brand-primary)", marginBottom: "6px" }}>
              <DollarSign size={18} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Efectivo Físico</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)" }}>
              {formatSoles(totalEfectivo)}
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
              {conteoPorMetodo.EFECTIVO} operación(es)
            </div>
          </div>

          {/* WALLETS (YAPE / PLIN) */}
          <div
            style={{
              background: "var(--bg-surface-elevated, #162032)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a855f7", marginBottom: "6px" }}>
              <Smartphone size={18} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Billeteras (Yape/Plin)</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)" }}>
              {formatSoles(totalBilleteras)}
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
              Yape: {formatSoles(sumaPorMetodo.YAPE)} • Plin: {formatSoles(sumaPorMetodo.PLIN)}
            </div>
          </div>

          {/* CARDS (DEBIT / CREDIT) */}
          <div
            style={{
              background: "var(--bg-surface-elevated, #162032)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-accent)", marginBottom: "6px" }}>
              <CreditCard size={18} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>POS / Tarjetas</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)" }}>
              {formatSoles(totalTarjetas)}
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
              {conteoPorMetodo.TARJETA + conteoPorMetodo.TARJETA_DEBITO + conteoPorMetodo.TARJETA_CREDITO} operación(es)
            </div>
          </div>

          {/* TRANSFERS */}
          <div
            style={{
              background: "var(--bg-surface-elevated, #162032)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", marginBottom: "6px" }}>
              <Receipt size={18} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Transferencias</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)" }}>
              {formatSoles(totalTransferencias)}
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
              {conteoPorMetodo.TRANSFERENCIA + conteoPorMetodo.OTRO} operación(es)
            </div>
          </div>
        </div>

        {/* OPERATIONS AUDIT TABLE */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px 0", color: "var(--text-main)" }}>
            Desglose por Responsable de Cobro
          </h4>
          <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Vendedor / Recepcionista</th>
                  <th style={{ textAlign: "right" }}>Total Cobrado</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(ventasPorVendedor).length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                      No se registraron transacciones durante este turno.
                    </td>
                  </tr>
                ) : (
                  Object.entries(ventasPorVendedor).map(([vendedor, monto]) => (
                    <tr key={vendedor}>
                      <td>
                        <strong style={{ color: "var(--text-main)" }}>{vendedor}</strong>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-brand-primary)" }}>
                        {formatSoles(monto)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ANULACIONES SUMMARY */}
        {pagosAnulados.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "var(--text-main)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
            <div>
              <strong>{pagosAnulados.length} comprobante(s) anulado(s)</strong> en este turno por un total de{" "}
              {formatSoles(pagosAnulados.reduce((a, b) => a + Number(b.monto || 0), 0))}.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalArqueoCaja;
