import React from "react";

const Badge = ({
  status,
  text,
  type = null,
  variant = null,
  dot = true,
  children,
}) => {
  let badgeClass = "badge-info";
  const finalType = variant || type;

  if (finalType) {
    badgeClass = `badge-${finalType}`;
  } else if (typeof status === "boolean") {
    badgeClass = status ? "badge-success" : "badge-danger";
  } else if (typeof status === "string") {
    const s = status.toUpperCase();
    if (["ACTIVO", "ACTIVA", "PRESENTE", "PAGADO", "COMPLETADA", "COMPLETADO"].includes(s)) {
      badgeClass = "badge-success";
    } else if (["PENDIENTE", "EN_CURSO", "JUSTIFICADA"].includes(s)) {
      badgeClass = "badge-warning";
    } else if (["INACTIVO", "INACTIVA", "VENCIDA", "CANCELADA", "FALTA", "ANULADO", "BLOQUEADO"].includes(s)) {
      badgeClass = "badge-danger";
    } else if (["SUSPENDIDA"].includes(s)) {
      badgeClass = "badge-purple";
    } else if (["EFECTIVO", "YAPE", "PLIN", "TARJETA", "TRANSFERENCIA"].includes(s)) {
      badgeClass = "badge-blue";
    }
  }

  const label =
    children ??
    text ??
    (typeof status === "boolean" ? (status ? "Activo" : "Inactivo") : status);

  return (
    <span className={`badge ${badgeClass}`}>
      {dot && <span className="badge-dot" />}
      {label}
    </span>
  );
};

export default Badge;
