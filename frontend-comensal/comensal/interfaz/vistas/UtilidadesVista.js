export const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
export const formatearDinero = (value) => `Bs ${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
export const timeText = (product) => product.tiempoEstimado ? `Aprox. ${product.tiempoEstimado} min` : "Tiempo por confirmar";
export const label = (state) => ({ recibido: "Recibido", pendiente: "Pendiente", confirmado: "Confirmado", preparando: "En preparación", listo: "Listo", entregado: "Entregado" })[String(state).toLowerCase()] || String(state || "Registrado");
export function qrImage(value) {
  if (!value || typeof value !== "string") return null;
  if (/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try {
    const url = new URL(value, globalThis.location?.href || "http://localhost/");
    if (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return url.href;
  } catch { /* URL inválida. */ }
  return null;
}

