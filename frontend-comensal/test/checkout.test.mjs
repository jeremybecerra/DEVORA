import test from "node:test";
import assert from "node:assert/strict";
import { Checkout } from "../comensal/js/checkout.js";
import { DemoApi } from "../comensal/js/demo.js";
import { cashWaitMs } from "../comensal/js/model.js";

test("la espera de efectivo dura 20 segundos y continúa tras recargar", () => {
  const payment = { solicitadoEn: 1_000 };
  assert.equal(cashWaitMs(payment, 1_000), 20_000);
  assert.equal(cashWaitMs(payment, 16_000), 5_000);
  assert.equal(cashWaitMs(payment, 22_000), 0);
});

test("la propina voluntaria actualiza el total sin perder centavos", () => {
  const checkout = new Checkout(42.5);
  checkout.setMethod("qr");
  assert.equal(checkout.setTip("3,75"), true);
  assert.equal(checkout.tip(), 3.75);
  assert.equal(checkout.total(), 46.25);
  assert.equal(checkout.setTip("tres"), false);
  assert.match(checkout.error, /monto válido/);
});

test("los productos nuevos se acumulan en el mismo pedido de prueba", async () => {
  const api = new DemoApi();
  const order = await api.createOrder("01", "c-1", [{ productoId: 1, cantidad: 1 }]);
  const updated = await api.addItems(order.id, [{ productoId: 1, cantidad: 1 }, { productoId: 4, cantidad: 1 }]);
  assert.equal(updated.id, order.id);
  assert.equal(updated.total, 99);
  assert.equal(updated.detalles.find((item) => item.productoId === 1).cantidad, 2);
  const before = Date.now();
  const payment = await api.requestPayment(order.id, "efectivo", 3.75);
  assert.equal(payment.estado, "pendiente_cobro");
  assert.equal(payment.totalPagar, 102.75);
  assert.ok(payment.solicitadoEn >= before && payment.solicitadoEn <= Date.now());
  api.endSession(order.id, payment.id);
});

test("el menú de prueba da tiempos de 5 a 20 minutos y los conserva en la sesión", async () => {
  const api = new DemoApi();
  const first = await api.getMenu();
  const second = await api.getMenu();
  assert.ok(first.every((item) => item.tiempoEstimado >= 5 && item.tiempoEstimado <= 20));
  assert.deepEqual(first.map((item) => item.tiempoEstimado), second.map((item) => item.tiempoEstimado));
  assert.ok(first.every((item) => item.imagenUrl && item.ingredientes.length));
});
