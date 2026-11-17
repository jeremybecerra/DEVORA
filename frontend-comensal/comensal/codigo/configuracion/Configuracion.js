// Contrato provisional. Cambiar estas rutas cuando Pamela entregue su API.
export const config = Object.freeze({
  baseUrl: globalThis.window?.DEVORA_API_BASE_URL || "/api",
  demo: new URLSearchParams(globalThis.location?.search || "").get("demo") === "1",
  routes: Object.freeze({
    mesa: (id) => `/mesas/${encodeURIComponent(id)}`,
    llamarMesero: (id) => `/mesas/${encodeURIComponent(id)}/llamadas`,
    menu: "/productos",
    comensales: "/comensales",
    pedidos: "/pedidos",
    pedido: (id) => `/pedidos/${encodeURIComponent(id)}`,
    agregar: (id) => `/pedidos/${encodeURIComponent(id)}/items`,
    pagos: (id) => `/pedidos/${encodeURIComponent(id)}/pagos`,
    pago: (id) => `/pagos/${encodeURIComponent(id)}`,
  }),
});
