import React from "react";
import { FolderSearch } from "lucide-react";

const EmptyState = ({
  icon: Icon = FolderSearch,
  title = "No se encontraron registros",
  description = "No hay datos disponibles para mostrar en este momento.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={32} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
