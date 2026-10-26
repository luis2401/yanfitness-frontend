import React from "react";

const Badge = ({ status, text, type = null }) => {
  let badgeClass = "badge-info";
  let displayDot = true;

  if (type) {
    badgeClass = `badge-${type}`;
  } else if (typeof status === "boolean") {
    badgeClass = status ? "badge-success" : "badge-danger";
  } else if (typeof status === "string") {
    const s = status.toUpperCase();
    if (["ACTIVO", "ACTIVA", "PRESENTE", "PAGADO", "COMPLETADA"].includes(s)) {
      badgeClass = "badge-success";
    } else if (["PENDIENTE", "EN_CURSO", "JUSTIFICADA"].includes(s)) {
      badgeClass = "badge-warning";
    } else if (["INACTIVO", "INACTIVA", "VENCIDA", "CANCELADA", "FALTA", "ANULADO", "BLOQUEADO"].includes(s)) {
      badgeClass = "badge-danger";
    } else if (["SUSPENDIDA"].includes(s)) {
      badgeClass = "badge-purple";
    }
  }

  const label = text || (typeof status === "boolean" ? (status ? "Activo" : "Inactivo") : status);

  return (
    <span className={`badge ${badgeClass}`}>
      {displayDot && <span className="badge-dot" />}
      {label}
    </span>
  );
};

export default Badge;
