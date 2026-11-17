import test from "node:test";
import assert from "node:assert/strict";
import { esperaConfirmacionPagoDemo } from "../comensal/codigo/dominio/modelos/Validaciones.js";
import { VistaPagos } from "../comensal/interfaz/vistas/VistaPagos.js";

test("QR demora 10 segundos y conserva el tiempo restante tras recargar", () => {
  const pago = { metodo: "qr", solicitadoEn: 1000 };
  assert.equal(esperaConfirmacionPagoDemo(pago, 1000), 10000);
  assert.equal(esperaConfirmacionPagoDemo(pago, 7000), 4000);
  assert.equal(esperaConfirmacionPagoDemo(pago, 12000), 0);
});

test("efectivo conserva sus 20 segundos", () => {
  assert.equal(esperaConfirmacionPagoDemo({ metodo: "efectivo", solicitadoEn: 1000 }, 1000), 20000);
});

test("la vista QR real conserva el botón de verificación del servidor", () => {
  const raiz = { innerHTML: "", focus() {} };
  const vista = new VistaPagos();
  vista.render = (html) => { raiz.innerHTML = html; };
  vista.pending({ nombre: "Mesa 01" }, { metodo: "qr", estado: "pendiente_pago", totalPagar: 84, propina: 0 }, false);
  assert.match(raiz.innerHTML, /Verificar pago/);
  assert.match(raiz.innerHTML, /data-action="check-payment"/);
});
