import React from "react";

const LoadingSpinner = ({ text = "Cargando datos..." }) => {
  return (
    <div
      style={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        color: "var(--text-muted)",
      }}
    >
      <div className="spinner" />
      <span style={{ fontSize: "14px", fontWeight: 500 }}>{text}</span>
    </div>
  );
};

export default LoadingSpinner;
