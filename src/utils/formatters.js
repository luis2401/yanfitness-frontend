/**
 * Genera el Número de Operación (NOP) bajo el estándar oficial:
 * [INICIALES_SEDE]-[INICIALES_VENDEDOR][INICIAL_METODO]-[NUMERO_RANDOM_6_DIGITOS]
 * Ejemplo: Sede Central + Luis Vergaray + Efectivo => SC-LVE-849201
 */
export function generarNop({
  sedeNombre = "Sede Central",
  vendedorNombre = "Admin",
  metodoPago = "EFECTIVO",
}) {
  // 1. Iniciales de la sede
  let sedeCode = "SC";
  if (sedeNombre && typeof sedeNombre === "string") {
    const palabras = sedeNombre.trim().split(/\s+/).filter(Boolean);
    if (palabras.length >= 2) {
      sedeCode = (palabras[0][0] + palabras[1][0]).toUpperCase();
    } else if (palabras.length === 1) {
      sedeCode = palabras[0].substring(0, 2).toUpperCase();
    }
  }

  // 2. Iniciales del vendedor (Nombre + Apellido)
  let vendCode = "AD";
  if (vendedorNombre && typeof vendedorNombre === "string") {
    const partes = vendedorNombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      vendCode = (partes[0][0] + partes[1][0]).toUpperCase();
    } else if (partes.length === 1) {
      vendCode = partes[0].substring(0, 2).toUpperCase();
    }
  }

  // 3. Inicial del método de pago
  let metCode = "E";
  const m = (metodoPago || "").toUpperCase();
  if (m.includes("YAPE")) metCode = "Y";
  else if (m.includes("PLIN")) metCode = "P";
  else if (m.includes("TARJETA")) metCode = "T";
  else if (m.includes("TRANSFERENCIA")) metCode = "TR";
  else if (m.includes("EFECTIVO")) metCode = "E";

  // 4. Código combinado vendedor + método
  const vendMetodo = `${vendCode}${metCode}`;

  // 5. Número aleatorio de 6 dígitos
  const randomNum = Math.floor(100000 + Math.random() * 900000);

  return `${sedeCode}-${vendMetodo}-${randomNum}`;
}

/**
 * Formatea la vigencia de una membresía de manera humana y profesional.
 * Ejemplos: 30 días => "Vigencia: 1 mes", 90 días => "Vigencia: 3 meses (Trimestral)"
 */
export function formatearVigenciaMembresia(dias) {
  const d = Number(dias || 0);
  if (d <= 0) return "Sin vigencia definida";
  if (d === 1) return "Pase Diario (1 día)";
  if (d === 30) return "Vigencia: 1 mes";
  if (d === 60) return "Vigencia: 2 meses";
  if (d === 90) return "Vigencia: 3 meses (Trimestral)";
  if (d === 180) return "Vigencia: 6 meses (Semestral)";
  if (d === 365 || d === 360) return "Vigencia: 1 año (Anual)";
  if (d % 30 === 0) return `Vigencia: ${Math.round(d / 30)} meses`;
  return `Vigencia: ${d} días`;
}
