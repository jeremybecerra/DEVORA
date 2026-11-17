import { escape, formatearDinero, timeText, label, qrImage } from "./UtilidadesVista.js";

export class VistaPedidos {

  confirmPay(table, order, newItems) {
    this.render(`<section class="receipt"><p class="eyebrow">${escape(table.nombre)} · Antes de pagar</p><h1>¿Pagar solo lo confirmado?</h1><p class="lead">Tienes productos elegidos que aún no enviaste a cocina. Si continúas al pago, estos productos se quitarán de tu selección.</p>
      <div class="panel"><h2>Sin confirmar</h2><ul class="summary-list">${newItems.map((item) => `<li><span>${item.cantidad} × ${escape(item.nombre)}</span><strong>${formatearDinero(item.subtotal)}</strong></li>`).join("")}</ul>
      <div class="receipt-total"><span>Consumo confirmado para pagar</span><strong>${formatearDinero(order.total)}</strong></div>
      <div class="receipt-actions"><button class="btn btn-secondary" data-action="keep-selecting">Seguir eligiendo</button><button class="btn btn-primary" data-action="discard-and-pay">Quitar selección y pagar</button></div></div>
    </section>`, true);
  }

  receipt(table, guest, order, demo) {
    const date = order.fecha ? new Date(order.fecha) : null;
    const dateText = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(date) : "No indicada";
    this.render(`<section class="receipt"><div class="receipt-head"><span class="check-mark" aria-hidden="true">✓</span><p class="eyebrow">Paso 3 de 3</p><h1>¡Pedido registrado!</h1>
<p>Tu pedido fue registrado correctamente. Aquí puedes revisar tu consumo individual.</p>
      <div class="panel"><div class="receipt-meta"><div><small>Mesa</small><strong>${escape(table.nombre)}</strong></div><div><small>Comensal</small><strong>${escape(guest.nombre)}</strong></div><div><small>Número de pedido</small><strong>${escape(order.id || "No indicado")}</strong></div><div><small>Fecha y hora</small><strong>${escape(dateText)}</strong></div></div>
      <h2 style="text-align: left;">Detalle de tu pedido</h2><ul class="receipt-items">${order.detalles.map((item) => `<li><span><b>${item.cantidad} × ${escape(item.nombre)}</b><small>${formatearDinero(item.precio)} por unidad</small></span><strong>${formatearDinero(item.subtotal)}</strong></li>`).join("")}</ul>
      <div class="receipt-total"><span>Total individual</span><strong>${formatearDinero(order.total)}</strong></div><p class="notice success">Estado del pedido: <strong>${escape(label(order.estado))}</strong></p><p class="summary-note">Este registro no indica que se haya realizado un pago.</p>
      <div class="receipt-actions"><button class="btn btn-secondary" data-action="add-more">Pedir algo más</button><button class="btn btn-primary" data-action="start-payment">Pagar mi consumo</button>${!demo && order.id ? '<button class="btn btn-secondary" data-action="refresh-order">Actualizar estado</button>' : ""}</div></div>
    </section>`, true);
  }
}
