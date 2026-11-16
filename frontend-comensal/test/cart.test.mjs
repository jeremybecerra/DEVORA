import test from "node:test";
import assert from "node:assert/strict";
import { Cart } from "../comensal/js/cart.js";

const menu = [{ id: 1, nombre: "Plato", precio: 25, disponible: true }];

test("CA-02: el carrito vacío no produce ítems de pedido", () => {
  const cart = new Cart();
  assert.equal(cart.empty(), true);
  assert.deepEqual(cart.items(menu), []);
  assert.equal(cart.total(menu), 0);
});

test("cantidades y subtotales informativos se actualizan", () => {
  const cart = new Cart();
  assert.equal(cart.set(1, 2), true);
  assert.equal(cart.total(menu), 50);
  assert.equal(cart.set(1, 0), true);
  assert.equal(cart.empty(), true);
});
