import React, { useState, useEffect } from "react";
import { pagosService, sedesService } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import FormularioPaseDiarioModal from "../components/pagos/FormularioPaseDiarioModal";
import ModalArqueoCaja from "../components/pagos/ModalArqueoCaja";
import {
  Receipt,
  Ticket,
  RefreshCw,
  Ban,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  CreditCard,
  Smartphone,
} from "lucide-react";

const CajaPagos = () => {
  const { usuario, isAdmin, showToast, sedeTurno } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [sedeFiltro, setSedeFiltro] = useState(() => (sedeTurno?.id ? String(sedeTurno.id) : ""));
  const [loading, setLoading] = useState(true);

  const [modalPaseOpen, setModalPaseOpen] = useState(false);
  const [modalArqueoOpen, setModalArqueoOpen] = useState(false);

  // Void payment modal
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [pagoAAnular, setPagoAAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [savingAnular, setSavingAnular] = useState(false);

  // Sync sedeFiltro when sedeTurno changes
  useEffect(() => {
    if (sedeTurno?.id) {
      setSedeFiltro(String(sedeTurno.id));
    }
  }, [sedeTurno]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [sedesData, pagosData] = await Promise.all([
        sedesService.listar(true).catch(() => []),
        pagosService.listar(sedeFiltro ? Number(sedeFiltro) : undefined).catch(() => []),
      ]);
      setSedes(Array.isArray(sedesData) ? sedesData : sedesData?.content || []);
      setPagos(Array.isArray(pagosData) ? pagosData : pagosData?.content || []);
    } catch (err) {
      showToast(err.message || "Error al cargar transacciones", "error");
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [sedeFiltro]);

  const handleAnular = async (e) => {
    e.preventDefault();
    if (!pagoAAnular || !motivoAnulacion.trim()) return;
    setSavingAnular(true);
    try {
      await pagosService.anularPago(pagoAAnular.id, motivoAnulacion.trim());
      showToast("Comprobante anulado correctamente", "success");
      setModalAnularOpen(false);
      cargarDatos();
    } catch (err) {
      showToast(err.message || "Error al anular el pago", "error");
    } finally {
      setSavingAnular(false);
    }
  };

  const totalRecaudado = pagos
    .filter((p) => p.estado !== "ANULADO")
    .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

  const sedeActualNombre =
    sedes.find((s) => String(s.id) === String(sedeFiltro))?.nombre ||
    sedeTurno?.nombre ||
    "Todas las Sedes";

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Receipt size={22} style={{ color: "var(--color-brand-primary)" }} />
              Caja y Cobros ({sedeActualNombre})
            </h2>
            <p>
              Transacciones cobradas • Total Recaudado:{" "}
              <strong style={{ color: "var(--color-brand-primary)", fontSize: "16px" }}>
                S/ {totalRecaudado.toFixed(2)}
              </strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarDatos}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spinner" : ""} />
              Actualizar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalArqueoOpen(true)}
              style={{
                borderColor: "rgba(0, 210, 255, 0.4)",
                color: "var(--color-accent)",
                fontWeight: 700,
              }}
            >
              <FileSpreadsheet size={16} />
              Arqueo de Turno
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalPaseOpen(true)}
            >
              <Ticket size={16} />
              Cobrar Pase Diario
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>
            Filtrar por Sede:
          </span>
          <select
            className="form-control"
            style={{ width: "230px" }}
            value={sedeFiltro}
            onChange={(e) => setSedeFiltro(e.target.value)}
          >
            <option value="">Todas las Sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Mostrando <strong>{pagos.length}</strong> operaciones registradas
        </div>
      </div>

      {/* PAYMENTS TABLE */}
      {loading ? (
        <LoadingSpinner text="Consultando registro de caja..." />
      ) : pagos.length === 0 ? (
        <EmptyState
          title="No hay pagos registrados"
          description="Los cobros de suscripciones y pases diarios aparecerán aquí con su comprobante."
          actionLabel="Cobrar Pase Diario"
          onAction={() => setModalPaseOpen(true)}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>N° Op / ID</th>
                  <th>Fecha y Hora</th>
                  <th>Concepto / Detalle</th>
                  <th>Sede</th>
                  <th>Método</th>
                  <th>Vendedor</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  {isAdmin && <th style={{ textAlign: "right" }}>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => {
                  const esAnulado = p.estado === "ANULADO";
                  return (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-brand-primary)" }}>
                          #{p.id}
                        </span>
                        {p.numeroOperacion && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            Op: {p.numeroOperacion}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "13px", color: "var(--text-main)" }}>
                          {p.fechaPago ? new Date(p.fechaPago).toLocaleDateString("es-PE") : "—"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {p.fechaPago ? new Date(p.fechaPago).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "var(--text-main)", fontSize: "13.5px" }}>
                          {p.tipoVenta === "PASE_DIARIO"
                            ? `Pase Diario: ${p.visitanteNombre || "Visitante"}`
                            : p.nombrePlan || "Suscripción a Membresía"}
                        </strong>
                        {p.socioNombre && (
                          <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                            Socio: {p.socioNombre}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "13px" }}>{p.sedeNombre || "General"}</span>
                      </td>
                      <td>
                        <Badge variant="blue">{p.metodo || "EFECTIVO"}</Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                          {p.vendedorNombre || "Caja"}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: "15px", color: esAnulado ? "var(--text-muted)" : "var(--color-brand-primary)" }}>
                          S/ {Number(p.monto || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <Badge variant={esAnulado ? "danger" : "success"}>
                          {p.estado || "PAGADO"}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: "right" }}>
                          {!esAnulado && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: "var(--color-danger)" }}
                              onClick={() => {
                                setPagoAAnular(p);
                                setMotivoAnulacion("");
                                setModalAnularOpen(true);
                              }}
                              title="Anular comprobante"
                            >
                              <Ban size={14} />
                              Anular
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL COBRAR PASE DIARIO */}
      <FormularioPaseDiarioModal
        isOpen={modalPaseOpen}
        onClose={() => setModalPaseOpen(false)}
        onSuccess={() => {
          setModalPaseOpen(false);
          cargarDatos();
        }}
      />

      {/* MODAL ARQUEO DE CAJA / CUADRE DE TURNO */}
      <ModalArqueoCaja
        isOpen={modalArqueoOpen}
        onClose={() => setModalArqueoOpen(false)}
        pagos={pagos}
        sedeNombre={sedeActualNombre}
        usuario={usuario}
      />

      {/* MODAL ANULAR PAGO */}
      <Modal
        isOpen={modalAnularOpen}
        onClose={() => setModalAnularOpen(false)}
        title={`Anular Pago #${pagoAAnular?.id}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalAnularOpen(false)}
              disabled={savingAnular}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleAnular}
              disabled={savingAnular || !motivoAnulacion.trim()}
            >
              {savingAnular ? "Anulando..." : "Confirmar Anulación"}
            </button>
          </>
        }
      >
        <form onSubmit={handleAnular}>
          <div className="alert alert-danger" style={{ marginBottom: "16px" }}>
            <strong>Advertencia:</strong> Esta acción marcará la transacción como ANULADA y restará el importe del balance de caja de la sede.
          </div>

          <div style={{ marginBottom: "16px", fontSize: "14px" }}>
            Monto a anular: <strong>S/ {Number(pagoAAnular?.monto || 0).toFixed(2)}</strong>
          </div>

          <div className="form-group">
            <label className="form-label">Motivo de Anulación *</label>
            <textarea
              className="form-control"
              rows={3}
              required
              placeholder="Ej. Error en digitación de monto, pago cancelado por el cliente, etc."
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CajaPagos;
