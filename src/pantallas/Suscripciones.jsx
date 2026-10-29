import React, { useState, useEffect, useMemo } from "react";
import { suscripcionesService, sociosService } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import FormularioSuscripcionModal from "../components/suscripciones/FormularioSuscripcionModal";
import Modal from "../components/common/Modal";
import { formatearVigenciaMembresia } from "../utils/formatters";
import {
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  Building2,
  DollarSign,
  AlertTriangle,
  SlidersHorizontal,
  MessageCircle,
} from "lucide-react";

const Suscripciones = () => {
  const { isAdmin, showToast } = useAuth();
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("TODAS"); // TODAS, ACTIVAS, POR_VENCER, VENCIDAS
  const [searchTerm, setSearchTerm] = useState("");

  const [modalNewOpen, setModalNewOpen] = useState(false);
  const [socioParaRenovar, setSocioParaRenovar] = useState(null);

  // Status Change Modal
  const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
  const [subSeleccionada, setSubSeleccionada] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("ACTIVA");
  const [motivoEstado, setMotivoEstado] = useState("");
  const [savingEstado, setSavingEstado] = useState(false);

  // Teléfonos en memoria para contacto WhatsApp
  const [telefonosSocios, setTelefonosSocios] = useState({});

  useEffect(() => {
    sociosService
      .listar()
      .then((res) => {
        const lista = Array.isArray(res) ? res : res?.content || [];
        const map = {};
        lista.forEach((s) => {
          if (s.id && s.telefono) map[s.id] = s.telefono;
        });
        setTelefonosSocios(map);
      })
      .catch(() => {});
  }, []);

  // Días que faltan para el vencimiento (negativo si ya venció)
  const calcularDiasRestantes = (fechaFin) => {
    if (!fechaFin) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin + "T00:00:00");
    return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
  };

  const esVencida = (sub) => {
    const dias = calcularDiasRestantes(sub.fechaFin);
    return sub.estado === "VENCIDA" || (dias !== null && dias < 0);
  };

  const abrirWhatsAppRenovacion = (sub) => {
    const tel = sub.socioTelefono || telefonosSocios[sub.socioId];
    if (!tel) {
      showToast("El socio no tiene un teléfono registrado para WhatsApp", "warning");
      return;
    }
    const cleanTel = tel.replace(/\D/g, "");
    const numFinal = cleanTel.startsWith("51") ? cleanTel : `51${cleanTel}`;

    const nombre = sub.socioNombre || "Estimado socio";
    const plan = sub.nombrePlanVendido || "tu membresía";
    const dias = calcularDiasRestantes(sub.fechaFin);

    let texto;
    if (esVencida(sub)) {
      // Membresía ya vencida: invitación a regresar
      texto =
        `Hola ${nombre}, te saludamos de YanFitness 💪.\n` +
        `Tu plan ${plan} venció el ${sub.fechaFin} y te extrañamos en el gimnasio.\n\n` +
        `Renueva hoy y retoma tus entrenamientos sin perder tu progreso. ` +
        `Responde a este mensaje y te ayudamos con tu renovación.`;
    } else if (dias !== null && dias <= 10) {
      // 10 días o menos: mensaje de urgencia
      const cuando = dias === 0 ? "HOY" : dias === 1 ? "MAÑANA" : `en ${dias} días`;
      texto =
        `Hola ${nombre}, te saludamos de YanFitness 💪.\n` +
        `⚠️ Tu plan ${plan} está pronto a vencer: vence ${cuando} (${sub.fechaFin}).\n\n` +
        `¡Renueva ahora! Tu nuevo plan empezará justo cuando termine el actual, así no pierdes ningún día. ` +
        `Responde a este mensaje para coordinar tu renovación.`;
    } else {
      // Más de 10 días: recordatorio informativo
      texto =
        `Hola ${nombre}, te saludamos de YanFitness 💪.\n` +
        `Te recordamos que tu plan ${plan} está vigente y vence el ${sub.fechaFin} (faltan ${dias} días).\n\n` +
        `Si deseas, puedes renovarlo con anticipación: los días se suman al final de tu plan actual. ` +
        `¡Cualquier consulta, escríbenos por aquí!`;
    }

    window.open(`https://wa.me/${numFinal}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const cargarSuscripciones = async () => {
    try {
      setLoading(true);
      if (activeTab === "POR_VENCER") {
        const [porVencerData, todasActivasData] = await Promise.all([
          suscripcionesService.obtenerPorVencer(7).catch(() => []),
          suscripcionesService.listar({ estado: "ACTIVA" }).catch(() => []),
        ]);
        const listaPorVencer = Array.isArray(porVencerData) ? porVencerData : porVencerData?.content || [];
        const todasActivas = Array.isArray(todasActivasData) ? todasActivasData : todasActivasData?.content || [];

        // Doble salvaguarda: si el socio tiene otra suscripción activa cuya fechaFin sea posterior a la que está por vencer,
        // significa que ya renovó / extendió y no debe mostrarse como por vencer.
        const filtradas = listaPorVencer.filter((sub) => {
          const tieneMembresiaPosterior = todasActivas.some(
            (otra) =>
              Number(otra.socioId) === Number(sub.socioId) &&
              Number(otra.id) !== Number(sub.id) &&
              otra.fechaFin > sub.fechaFin &&
              otra.estado === "ACTIVA"
          );
          return !tieneMembresiaPosterior;
        });

        setSuscripciones(filtradas);
      } else {
        const estadoParam = activeTab === "TODAS" ? undefined : activeTab;
        const data = await suscripcionesService.listar({ estado: estadoParam });
        setSuscripciones(Array.isArray(data) ? data : data?.content || []);
      }
    } catch (err) {
      showToast(err.message || "Error al cargar suscripciones", "error");
      setSuscripciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSuscripciones();
  }, [activeTab]);

  const handleCambiarEstado = async (e) => {
    e.preventDefault();
    if (!subSeleccionada) return;
    setSavingEstado(true);
    try {
      await suscripcionesService.cambiarEstado(
        subSeleccionada.id,
        nuevoEstado,
        motivoEstado || null
      );
      showToast("Estado de suscripción actualizado", "success");
      setModalEstadoOpen(false);
      cargarSuscripciones();
    } catch (err) {
      showToast(err.message || "No se pudo cambiar el estado", "error");
    } finally {
      setSavingEstado(false);
    }
  };

  const suscripcionesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return suscripciones;
    const term = searchTerm.toLowerCase();
    return suscripciones.filter((s) => {
      const matchSocio = s.socioNombre?.toLowerCase().includes(term);
      const matchPlan = s.nombrePlanVendido?.toLowerCase().includes(term);
      const matchSede = s.sedeNombre?.toLowerCase().includes(term);
      return matchSocio || matchPlan || matchSede;
    });
  }, [suscripciones, searchTerm]);

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
        <div className="card-header" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CreditCard size={22} style={{ color: "var(--color-brand-primary)" }} />
              Control de Membresías y Suscripciones
            </h2>
            <p>Vigencias, renovaciones continuas y contratos activos de los socios</p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarSuscripciones}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spinner" : ""} />
              Actualizar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSocioParaRenovar(null);
                setModalNewOpen(true);
              }}
            >
              <Plus size={16} />
              Nueva Suscripción
            </button>
          </div>
        </div>
      </div>

      {/* TABS & SEARCH */}
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
        <div style={{ display: "flex", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-light)" }}>
          {[
            { id: "TODAS", label: "Todas" },
            { id: "ACTIVA", label: "Activas" },
            { id: "POR_VENCER", label: "Por Vencer (7 días)" },
            { id: "VENCIDA", label: "Vencidas" },
            { id: "SUSPENDIDA", label: "Suspendidas" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background:
                  activeTab === tab.id
                    ? "var(--color-brand-primary)"
                    : "var(--bg-surface-elevated, #162032)",
                color: activeTab === tab.id ? "#090d16" : "var(--text-secondary)",
                transition: "all var(--transition-fast)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper" style={{ minWidth: "280px" }}>
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por socio, plan o sede..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <LoadingSpinner text="Cargando suscripciones..." />
      ) : suscripcionesFiltradas.length === 0 ? (
        <EmptyState
          title="No se encontraron suscripciones"
          description={
            activeTab === "POR_VENCER"
              ? "Excelente: No hay membresías por vencer en los próximos 7 días."
              : "No se registran suscripciones con los criterios seleccionados."
          }
          actionLabel="Emitir Nueva Suscripción"
          onAction={() => {
            setSocioParaRenovar(null);
            setModalNewOpen(true);
          }}
        />
      ) : (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Plan Contratado</th>
                <th>Sede</th>
                <th>Vigencia (Inicio → Fin)</th>
                <th>Monto</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {suscripcionesFiltradas.map((sub) => {
                const esFinalizada = sub.estado === "VENCIDA" || sub.estado === "CANCELADA";
                return (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "14px" }}>
                        {sub.socioNombre || `Socio #${sub.socioId}`}
                      </div>
                      {sub.socioDni && (
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          DNI: {sub.socioDni}
                        </div>
                      )}
                      {sub.accesoMultisede && (
                        <span className="badge badge-purple" style={{ fontSize: "11px", marginTop: "2px" }}>
                          Multisede
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-brand-primary)" }}>
                        {sub.nombrePlanVendido || "Plan de Gimnasio"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {formatearVigenciaMembresia(sub.duracionDiasVendida)}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {sub.sedeNombre || "General"}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: "13px" }}>
                        <strong>{sub.fechaInicio}</strong> →{" "}
                        <strong style={{ color: "var(--color-brand-primary)" }}>{sub.fechaFin}</strong>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "14px" }}>
                        S/ {Number(sub.precioVendido || 0).toFixed(2)}
                      </span>
                    </td>

                    <td>
                      <Badge status={sub.estado} />
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                        {/* BOTÓN WHATSAPP RENOVACIÓN */}
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            background: "#25D366",
                            color: "#FFFFFF",
                            border: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontWeight: 600,
                            padding: "6px 10px",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                          }}
                          onClick={() => abrirWhatsAppRenovacion(sub)}
                          title={
                            esVencida(sub)
                              ? "Invitar a renovar (membresía vencida)"
                              : calcularDiasRestantes(sub.fechaFin) <= 10
                              ? "Avisar: pronto a vencer, renueva ahora"
                              : "Enviar recordatorio de vigencia"
                          }
                        >
                          <MessageCircle size={14} />
                          {esVencida(sub)
                            ? "Renovar (vencida)"
                            : calcularDiasRestantes(sub.fechaFin) <= 10
                            ? `Avisar · ${calcularDiasRestantes(sub.fechaFin)}d`
                            : "WhatsApp"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: "var(--color-brand-primary)" }}
                          onClick={() => {
                            setSocioParaRenovar({
                              id: sub.socioId,
                              nombre: sub.socioNombre || `Socio #${sub.socioId}`,
                              dni: sub.socioDni || "",
                              activo: true,
                              sedeId: sub.sedeId,
                            });
                            setModalNewOpen(true);
                          }}
                        >
                          <Plus size={14} />
                          {esFinalizada ? "Renovar" : "Sumar Plan"}
                        </button>

                        {isAdmin && !esFinalizada && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSubSeleccionada(sub);
                              setNuevoEstado(sub.estado);
                              setMotivoEstado("");
                              setModalEstadoOpen(true);
                            }}
                          >
                            <SlidersHorizontal size={14} />
                            Estado
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW / EXTEND SUBSCRIPTION MODAL */}
      {modalNewOpen && (
        <FormularioSuscripcionModal
          isOpen={modalNewOpen}
          socioPreseleccionado={socioParaRenovar}
          onClose={() => {
            setModalNewOpen(false);
            setSocioParaRenovar(null);
          }}
          onSuccess={() => {
            setModalNewOpen(false);
            setSocioParaRenovar(null);
            cargarSuscripciones();
          }}
        />
      )}

      {/* CHANGE STATE MODAL (ADMIN) */}
      {modalEstadoOpen && subSeleccionada && (
        <Modal
          isOpen={modalEstadoOpen}
          onClose={() => setModalEstadoOpen(false)}
          title={`Cambiar Estado de Suscripción #${subSeleccionada.id}`}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalEstadoOpen(false)}
                disabled={savingEstado}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCambiarEstado}
                disabled={savingEstado}
              >
                {savingEstado ? "Guardando..." : "Actualizar Estado"}
              </button>
            </>
          }
        >
          <form onSubmit={handleCambiarEstado}>
            <div style={{ marginBottom: "16px", fontSize: "14px" }}>
              Socio: <strong>{subSeleccionada.socioNombre}</strong> • Plan:{" "}
              <strong>{subSeleccionada.nombrePlanVendido}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Nuevo Estado *</label>
              <select
                className="form-control"
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                required
              >
                <option value="ACTIVA">ACTIVA</option>
                <option value="SUSPENDIDA">SUSPENDIDA (Pausa temporal)</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Motivo u Observación</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Solicitud por viaje médico"
                value={motivoEstado}
                onChange={(e) => setMotivoEstado(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Suscripciones;
