import test from "node:test";
import assert from "node:assert/strict";
import { HttpApi } from "../comensal/js/api.js";

test("CA-01: envía mesa, comensal, productos y cantidades; conserva el total del servidor", async () => {
  let sent;
  const fetcher = async (_url, options) => {
    sent = JSON.parse(options.body);
    return { ok: true, json: async () => ({ id: 8, total: 59, estado: "recibido", detalles: [{ productoId: 1, nombre: "Plato", cantidad: 2, precio: 29.5, subtotal: 59 }] }) };
  };
  const api = new HttpApi("http://localhost:3000/api", { pedidos: "/pedidos" }, fetcher);
  const result = await api.createOrder("01", "c-1", [{ productoId: 1, cantidad: 2 }]);
  assert.deepEqual(sent, { mesaId: "01", comensalId: "c-1", items: [{ productoId: 1, cantidad: 2 }] });
  assert.equal(result.total, 59);
  assert.equal(result.estado, "recibido");
});

test("los añadidos y el pago usan el identificador del pedido existente", async () => {
  const calls = [];
  const routes = { agregar: (id) => `/pedidos/${id}/items`, pagos: (id) => `/pedidos/${id}/pagos` };
  const fetcher = async (url, options) => {
    calls.push({ url, method: options.method, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({}) };
  };
  const api = new HttpApi("/api", routes, fetcher);
  await api.addItems(31, [{ productoId: 4, cantidad: 2 }]);
  await api.requestPayment(31, "qr", 5.5);
  assert.deepEqual(calls, [
    { url: "/api/pedidos/31/items", method: "POST", body: { items: [{ productoId: 4, cantidad: 2 }] } },
    { url: "/api/pedidos/31/pagos", method: "POST", body: { metodo: "qr", propina: 5.5 } },
  ]);
});

test("la llamada al mesero identifica la mesa y el comensal cuando existe", async () => {
  let sent;
  const api = new HttpApi("/api", { llamarMesero: (id) => `/mesas/${id}/llamadas` }, async (url, options) => {
    sent = { url, method: options.method, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ estado: "recibido" }) };
  });
  await api.callWaiter("01", "c-1");
  assert.deepEqual(sent, { url: "/api/mesas/01/llamadas", method: "POST", body: { comensalId: "c-1" } });
});
