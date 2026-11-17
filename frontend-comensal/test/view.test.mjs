import test from "node:test";
import assert from "node:assert/strict";
import { Cart } from "../comensal/js/cart.js";
import { View } from "../comensal/js/view.js";

test("el menú muestra solo la categoría seleccionada y conserva el resumen", () => {
  const root = { innerHTML: "" };
  const view = new View(root, {});
  const products = [
    { id: 1, nombre: "Hamburguesa", descripcion: "", categoria: "Platos principales", precio: 25, disponible: true },
    { id: 2, nombre: "Limonada", descripcion: "", categoria: "Bebidas", precio: 15, disponible: true },
  ];
  const cart = new Cart({ 1: 1 });
  view.menu({ table: { nombre: "Mesa 01" }, guest: { nombre: "Alejandra" }, products, cart, category: "Bebidas" });

  assert.match(root.innerHTML, /aria-pressed="true"[^>]*>Bebidas/);
  assert.match(root.innerHTML, /class="product-title">Limonada<\/span>/);
  assert.doesNotMatch(root.innerHTML, /class="product-title">Hamburguesa<\/span>/);
  assert.doesNotMatch(root.innerHTML, /1 × Hamburguesa/);
  assert.match(root.innerHTML, /Ver mi pedido/);
  assert.match(root.innerHTML, /class="btn btn-primary" data-action="open-summary"/);

  view.menu({ table: { nombre: "Mesa 01" }, guest: { nombre: "Alejandra" }, products, cart, category: "Bebidas", summaryOpen: true });
  assert.match(root.innerHTML, /1 × Hamburguesa/);
  assert.match(root.innerHTML, /role="dialog"/);
});

test("el detalle muestra ingredientes, foto y tiempo sin habilitar indicaciones", () => {
  const root = { innerHTML: "", focus() {} };
  const view = new View(root, {});
  view.detail({ nombre: "Mesa 01" }, {
    id: 1, nombre: "Hamburguesa", descripcion: "Carne y queso", categoria: "Platos", precio: 42,
    ingredientes: ["Carne", "Queso"], tiempoEstimado: 12, imagenUrl: "/assets/productos/hamburguesa.jpg", disponible: true,
  }, 0, true);
  assert.match(root.innerHTML, /12 min/);
  assert.match(root.innerHTML, /Carne<\/li>/);
  assert.match(root.innerHTML, /hamburguesa.jpg/);
  assert.match(root.innerHTML, /id="special-note"[^>]*disabled/);
});

test("CA-02: el resumen vacío impide confirmar", () => {
  const root = { innerHTML: "" };
  const view = new View(root, {});
  view.menu({ table: { nombre: "Mesa 01" }, guest: { nombre: "Alejandra" }, products: [], cart: new Cart(), summaryOpen: true });
  assert.match(root.innerHTML, /data-action="confirm" disabled/);
  assert.match(root.innerHTML, /Todavía no elegiste productos/);
});

test("tras pedir algo más, el menú conserva la opción de pagar lo confirmado", () => {
  const root = { innerHTML: "" };
  const view = new View(root, {});
  const order = { id: 31, total: 42, detalles: [{ nombre: "Hamburguesa", cantidad: 1, subtotal: 42 }] };
  view.menu({ table: { nombre: "Mesa 01" }, guest: { nombre: "Alejandra" }, products: [], cart: new Cart(), order });
  assert.match(root.innerHTML, /data-action="pay-confirmed">Pagar mi consumo/);
  assert.match(root.innerHTML, /class="btn btn-secondary" data-action="pay-confirmed"/);
  assert.match(root.innerHTML, /Total confirmado/);
  assert.match(root.innerHTML, /Bs 42,00/);
});

test("cambiar cantidades actualiza controles y total sin reconstruir la foto", () => {
  const foot = { innerHTML: "" };
  const count = { textContent: "" };
  const total = { textContent: "" };
  const root = {
    innerHTML: '<img src="/assets/productos/hamburguesa.jpg">',
    querySelector(selector) { return { "#order-count": count, "#order-total": total }[selector]; },
  };
  const button = { closest() { return { querySelector() { return foot; } }; } };
  const product = { id: 1, nombre: "Hamburguesa", precio: 42, disponible: true };
  const cart = new Cart({ 1: 2 });
  new View(root, {}).updateCart(button, product, 2, cart, [product], { total: 42 });
  assert.equal(root.innerHTML, '<img src="/assets/productos/hamburguesa.jpg">');
  assert.match(foot.innerHTML, /<output aria-live="polite">2<\/output>/);
  assert.equal(total.textContent, "Bs 126,00");
  assert.match(count.textContent, /2 productos nuevos/);
});

test("abrir el resumen conserva el menú y sus imágenes montadas", () => {
  const sheet = { removed: false, remove() { this.removed = true; } };
  const expand = { value: "false", setAttribute(_name, value) { this.value = value; } };
  const close = { focused: false, focus() { this.focused = true; } };
  const section = { insertAdjacentHTML(_where, html) { this.sheetHtml = html; } };
  const root = {
    innerHTML: '<img src="/assets/productos/hamburguesa.jpg">',
    querySelector(selector) {
      return { section, ".sheet-wrap": sheet, '[data-action="open-summary"]': expand, ".sheet-close": close }[selector];
    },
  };
  const view = new View(root, {});
  view.openSummary({ table: { nombre: "Mesa 01" }, guest: { nombre: "Alejandra" }, products: [], cart: new Cart() });
  assert.equal(root.innerHTML, '<img src="/assets/productos/hamburguesa.jpg">');
  assert.match(section.sheetHtml, /role="dialog"/);
  assert.equal(expand.value, "true");
  assert.equal(close.focused, true);
  view.closeSummary();
  assert.equal(sheet.removed, true);
  assert.equal(expand.value, "false");
});

test("efectivo avisa que el mesero va en camino sin pedir confirmación al cliente", () => {
  const root = { innerHTML: "", focus() {} };
  const payment = { metodo: "efectivo", estado: "pendiente_cobro", totalPagar: 45, propina: 3, qrUrl: null };
  new View(root, {}).pending({ nombre: "Mesa 01" }, payment, true);
  assert.match(root.innerHTML, /El mesero va en camino/);
  assert.match(root.innerHTML, /20 segundos/);
  assert.doesNotMatch(root.innerHTML, /data-action="check-payment"/);
  assert.match(root.innerHTML, /No se realizará un cobro real/);
});

test("QR de demostración espera 10 segundos sin botón de confirmación", () => {
  const root = { innerHTML: "", focus() {} };
  const payment = { metodo: "qr", estado: "pendiente_pago", totalPagar: 42, propina: 0, qrUrl: null };
  new View(root, {}).pending({ nombre: "Mesa 01" }, payment, true);
  assert.doesNotMatch(root.innerHTML, /data-action="check-payment"/);
  assert.match(root.innerHTML, /10 segundos/);
});

test("efectivo real solo permite consultar el estado del servidor", () => {
  const root = { innerHTML: "", focus() {} };
  const payment = { metodo: "efectivo", estado: "pendiente_cobro", totalPagar: 42, propina: 0, qrUrl: null };
  new View(root, {}).pending({ nombre: "Mesa 01" }, payment, false);
  assert.match(root.innerHTML, /Verificar estado/);
  assert.doesNotMatch(root.innerHTML, /Confirmar pago de prueba/);
});
