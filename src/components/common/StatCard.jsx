import React from "react";

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue", // blue, green, amber, purple, red
  onClick,
}) => {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="stat-content">
        <span className="stat-label">{title}</span>
        <span className="stat-value">{value}</span>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>

      {Icon && (
        <div className={`stat-icon-wrapper stat-icon-${color}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
