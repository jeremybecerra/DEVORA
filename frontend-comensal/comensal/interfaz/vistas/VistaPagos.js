import { escape, formatearDinero, timeText, label, qrImage } from "./UtilidadesVista.js";
import { FabricaEstrategiasPago } from "../../codigo/infraestructura/fabricas/FabricaEstrategiasPago.js";

export class VistaPagos {

  payment(table, order, checkout, error = "", busy = false, demo = false) {
    const estrategiasPago = FabricaEstrategiasPago.disponibles();
    this.render(`<section class="receipt"><p class="eyebrow">${escape(table.nombre)} · Pago individual</p><h1>¿Cómo prefieres pagar?</h1>
      ${demo ? '<p class="notice">Modo demostración: aquí no se realizan cobros reales.</p>' : ""}
      ${error ? `<p class="notice error" role="alert">${escape(error)}</p>` : ""}
      <div class="method-list" role="group" aria-label="Método de pago">
        ${estrategiasPago.map((estrategia) => `<button type="button" class="method-card" data-action="method" data-method="${estrategia.metodo}" aria-pressed="${checkout.method === estrategia.metodo}" ${busy ? "disabled" : ""}><strong>${estrategia.etiqueta}</strong><span>${estrategia.descripcion}</span></button>`).join("")}
      </div>
      ${checkout.method ? `<div class="panel pay-panel"><h2>${checkout.method === "efectivo" ? "Pago en efectivo" : "Pago con QR"}</h2><div class="pay-row"><span>Consumo confirmado</span><strong>${formatearDinero(order.total)}</strong></div>
        <div class="field"><label for="tip-input">Propina para el mesero (opcional)</label><input id="tip-input" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${escape(checkout.tipText)}" aria-describedby="tip-help tip-error" aria-invalid="${Boolean(checkout.error)}" ${busy ? "disabled" : ""}/><p class="helper" id="tip-help">Un gesto si lo deseas. No es una obligación; cualquier monto está bien.</p><p class="error-text" id="tip-error" role="alert">${escape(checkout.error)}</p></div>
        <div class="pay-row"><span>Propina</span><strong id="tip-amount">${formatearDinero(checkout.tip())}</strong></div><div class="pay-row pay-grand"><span>Total a pagar estimado</span><strong id="pay-total">${formatearDinero(checkout.total())}</strong></div>
        <p class="summary-note">El servidor confirmará el importe final antes del cobro.</p><button class="btn btn-primary btn-full" data-action="pay" ${busy || checkout.error ? "disabled" : ""}>${busy ? "Preparando pago…" : FabricaEstrategiasPago.crear(checkout.method).textoBoton}</button></div>` : ""}
      <button class="btn btn-secondary payment-back" data-action="back-receipt" ${busy ? "disabled" : ""}>Volver a mi pedido</button>
    </section>`, true);
  }

  pending(table, payment, demo = false, error = "") {
    const cash = payment.metodo === "efectivo";
    const qr = qrImage(payment.qrUrl);
    this.render(`<section class="receipt"><div class="receipt-head"><p class="eyebrow">${escape(table.nombre)} · Pago pendiente</p><h1>${cash ? "El mesero va en camino" : qr ? "Tu QR de pago" : "Pago con QR pendiente"}</h1><p>${cash ? demo ? "Simulamos que el mesero viene a cobrarte. En unos 20 segundos verás la despedida. No se realizará un cobro real." : "Avisamos al mesero para que se acerque a cobrarte. El pago seguirá pendiente hasta que el restaurante lo confirme." : demo ? "Simulamos la verificación del pago por QR. En unos 10 segundos se confirmará automáticamente. No se realizará un cobro real." : qr ? "Escanea el QR proporcionado por el restaurante. Verificaremos el pago antes de cerrar tu sesión." : "El restaurante todavía no entregó el código QR. Verifica de nuevo o pide ayuda al personal."}</p></div>
      <div class="panel">${error ? `<p class="notice error" role="alert">${escape(error)}</p>` : ""}
        ${!cash && qr ? `<div class="qr-wrap"><img src="${escape(qr)}" alt="Código QR de pago entregado por el servidor" /></div>` : !cash ? demo ? '<p class="notice">Pago QR de demostración: esperando confirmación automática…</p>' : '<p class="notice">El servidor aún no entregó un QR válido. Actualiza el estado o pide ayuda al personal.</p>' : ""}
        <div class="pay-row"><span>Consumo</span><strong>${formatearDinero(payment.totalPagar - payment.propina)}</strong></div><div class="pay-row"><span>Propina voluntaria</span><strong>${formatearDinero(payment.propina)}</strong></div><div class="pay-row pay-grand"><span>Total</span><strong>${formatearDinero(payment.totalPagar)}</strong></div>
        <p class="notice">Estado: <strong>${cash ? "Pendiente de cobro" : "Pendiente de pago"}</strong>. Todavía no se registró como pagado.</p>
        ${demo ? "" : `<div class="receipt-actions"><button class="btn btn-primary" data-action="check-payment">${cash ? "Verificar estado" : demo ? "Confirmar pago de prueba" : "Verificar pago"}</button></div>`}
      </div>
    </section>`, true);
  }

  thankYou(demo = false, method = "") {
    this.setTable(null);
    const demoText = method === "efectivo" ? "El cobro en efectivo se confirmó solo en esta demostración." : "El pago se confirmó solo en esta demostración.";
    this.render(`<section class="center-state panel"><span class="check-mark" aria-hidden="true">✓</span><p class="eyebrow">DEVORA</p><h1>Gracias por tu visita</h1>${demo ? `<p class="notice">${demoText} No se realizó un pago real.</p>` : ""}<p>¡Te esperamos otro día! Tu sesión de esta mesa se cerró. Para pedir en otra, abre su QR con la cámara de tu celular.</p><button class="btn btn-primary" data-action="home">Volver al inicio</button></section>`, true);
  }
}
