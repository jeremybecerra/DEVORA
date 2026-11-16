export function tableIdFromUrl() {
  const query = new URLSearchParams(location.search).get("mesa");
  if (query) return query.trim();
  const match = location.pathname.match(/\/mesa\/([^/]+)\/?$/);
  try { return match ? decodeURIComponent(match[1]).trim() : ""; }
  catch { return ""; }
}

export function validName(value) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2) return { error: "Escribe un nombre o apodo de al menos 2 caracteres." };
  if (name.length > 40) return { error: "El nombre o apodo no puede superar 40 caracteres." };
  return { name };
}

export function validProducts(data) {
  if (!Array.isArray(data)) throw new Error("El servidor devolvió un menú inválido.");
  return data.map((item) => {
    const price = Number(item.precio);
    if (item.id == null || !String(item.nombre || "").trim() || !Number.isFinite(price) || price < 0) {
      throw new Error("El servidor devolvió un producto con datos incompletos.");
    }
    const minutes = Number(item.tiempoEstimado);
    const image = String(item.imagenUrl || "");
    let imagenUrl = "";
    try {
      const parsed = new URL(image, globalThis.location?.origin || "http://localhost");
      if (image && (parsed.protocol === "https:" || (parsed.protocol === "http:" && parsed.origin === globalThis.location?.origin))) imagenUrl = parsed.href;
    } catch { /* La imagen es opcional. */ }
    return {
      id: item.id, nombre: item.nombre, descripcion: item.descripcion || "", categoria: item.categoria || "", precio: price,
      disponible: item.disponible !== false,
      ingredientes: Array.isArray(item.ingredientes) ? item.ingredientes.filter((part) => typeof part === "string" && part.trim()) : [],
      tiempoEstimado: Number.isInteger(minutes) && minutes > 0 && minutes <= 20 ? minutes : null,
      imagenUrl,
    };
  });
}

export function validOrder(data) {
  if (!data?.id || !Number.isFinite(Number(data.total)) || Number(data.total) < 0 || !Array.isArray(data.detalles) || !data.detalles.length) {
    throw new Error("El servidor respondió sin identificador, detalle o total del pedido. Consulta al restaurante antes de volver a enviarlo.");
  }
  const details = data.detalles.map((item) => {
    if (!String(item.nombre || "").trim() || !Number.isSafeInteger(Number(item.cantidad)) || Number(item.cantidad) <= 0 || !Number.isFinite(Number(item.precio)) || Number(item.precio) < 0 || !Number.isFinite(Number(item.subtotal)) || Number(item.subtotal) < 0) {
      throw new Error("El servidor respondió con un detalle de pedido incompleto. Consulta al restaurante antes de volver a enviarlo.");
    }
    return { nombre: item.nombre, cantidad: Number(item.cantidad), precio: Number(item.precio), subtotal: Number(item.subtotal) };
  });
  return { ...data, total: Number(data.total), detalles: details };
}

export function validPayment(data) {
  if (!data?.id || !["efectivo", "qr"].includes(data.metodo) || !data.estado || !Number.isFinite(Number(data.propina)) || Number(data.propina) < 0 || !Number.isFinite(Number(data.totalPagar)) || Number(data.totalPagar) < 0) {
    throw new Error("El servidor respondió con un pago incompleto. Consulta al restaurante antes de volver a solicitarlo.");
  }
  return { ...data, propina: Number(data.propina), totalPagar: Number(data.totalPagar) };
}

export function cashWaitMs(payment, now = Date.now()) {
  const started = Number(payment?.solicitadoEn);
  if (!Number.isFinite(started) || started <= 0) return 20_000;
  return Math.max(0, 20_000 - Math.max(0, now - started));
}
