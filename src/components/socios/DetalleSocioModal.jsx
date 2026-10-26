import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import Badge from "../common/Badge";
import { suscripcionesService, inscripcionesService } from "../../api/apiClient";
import { CreditCard, Calendar, Mail, Phone, Hash, Clock, CheckCircle } from "lucide-react";

const DetalleSocioModal = ({
  isOpen,
  onClose,
  socio,
  onEdit,
  onNuevaSuscripcion,
}) => {
  const [suscripcionVigente, setSuscripcionVigente] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  useEffect(() => {
    if (socio?.id && isOpen) {
      setLoadingExtra(true);
      Promise.all([
        suscripcionesService.obtenerVigenteDeSocio(socio.id).catch(() => null),
        inscripcionesService.obtenerPorSocio(socio.id).catch(() => []),
      ])
        .then(([sub, clss]) => {
          setSuscripcionVigente(sub);
          setInscripciones(clss || []);
        })
        .finally(() => setLoadingExtra(false));
    }
  }, [socio, isOpen]);

  if (!socio) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha del Socio: ${socio.nombre} ${socio.apellido || ""}`}
      size="lg"
      footer={
        <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "space-between" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onClose();
              onEdit(socio);
            }}
          >
            Editar Contacto
          </button>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onNuevaSuscripcion(socio);
              }}
            >
              Nueva / Renovar Membresía
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      }
    >
      {/* HEADER BIO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          padding: "16px",
          background: "var(--bg-surface-elevated, #162032)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-light)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#090d16",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            fontWeight: 800,
          }}
        >
          {socio.nombre?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
              {socio.nombre} {socio.apellido || ""}
            </h3>
            <Badge status={socio.activo} />
          </div>
          <div style={{ display: "flex", gap: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Hash size={14} /> DNI: <strong>{socio.dni}</strong>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={14} /> Registrado:{" "}
              {socio.fechaCreacion
                ? new Date(socio.fechaCreacion).toLocaleDateString("es-PE")
                : "Reciente"}
            </span>
          </div>
        </div>
      </div>

      {/* CONTACT INFO GRID */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
          Información de Contacto
        </h4>
        <div className="form-row">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Phone size={18} style={{ color: "var(--color-brand-primary)" }} />
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Teléfono Celular</div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{socio.telefono || "No registrado"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Mail size={18} style={{ color: "var(--color-brand-primary)" }} />
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Correo Electrónico</div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{socio.correo || "No registrado"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE SUBSCRIPTION */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
            Membresía / Suscripción Vigente
          </h4>
          <CreditCard size={18} style={{ color: "var(--color-brand-primary)" }} />
        </div>

        {loadingExtra ? (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Consultando estado...</p>
        ) : suscripcionVigente ? (
          <div
            style={{
              padding: "14px",
              background: "var(--color-brand-light)",
              border: "1px solid var(--color-brand-subtle)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-brand-primary)" }}>
                  {suscripcionVigente.nombrePlanVendido || "Plan de Membresía"}
                </span>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Sede: <strong>{suscripcionVigente.sedeNombre || "General"}</strong>
                  {suscripcionVigente.accesoMultisede && " • Multisede Activada"}
                </div>
              </div>
              <Badge status={suscripcionVigente.estado} />
            </div>
            <div style={{ display: "flex", gap: "20px", fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "10px" }}>
              <div>
                Inicio: <strong>{suscripcionVigente.fechaInicio}</strong>
              </div>
              <div>
                Vence: <strong style={{ color: "var(--color-brand-primary)" }}>{suscripcionVigente.fechaFin}</strong>
              </div>
              <div>
                Precio Pagado: <strong>S/ {Number(suscripcionVigente.precioVendido || 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "14px",
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-danger-text)",
              fontSize: "13px",
            }}
          >
            Este socio <strong>no cuenta con una suscripción activa</strong> actualmente.
          </div>
        )}
      </div>

      {/* ENROLLED CLASSES */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
            Clases Inscritas ({inscripciones.length})
          </h4>
          <Calendar size={18} style={{ color: "var(--color-accent)" }} />
        </div>

        {inscripciones.length === 0 ? (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
            El socio no está inscrito en ninguna clase grupal activa.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {inscripciones.map((ins) => (
              <div
                key={ins.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--bg-surface-elevated, #162032)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  fontSize: "13px",
                }}
              >
                <div>
                  <strong>{ins.claseNombre || `Clase #${ins.claseId}`}</strong>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Sede: {ins.sedeNombre || "Principal"}
                  </div>
                </div>
                <Badge status={(ins.activo ?? ins.activa) ? "ACTIVA" : "INACTIVA"} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DetalleSocioModal;
