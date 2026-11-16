const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
export const money = (value) => `Bs ${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
const timeText = (product) => product.tiempoEstimado ? `Aprox. ${product.tiempoEstimado} min` : "Tiempo por confirmar";
const label = (state) => ({ recibido: "Recibido", pendiente: "Pendiente", confirmado: "Confirmado", preparando: "En preparación", listo: "Listo", entregado: "Entregado" })[String(state).toLowerCase()] || String(state || "Registrado");
function qrImage(value) {
  if (!value || typeof value !== "string") return null;
  if (/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try {
    const url = new URL(value, globalThis.location?.href || "http://localhost/");
    if (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return url.href;
  } catch { /* URL inválida. */ }
  return null;
}

export class View {
  constructor(root, tableTag) { this.root = root; this.tableTag = tableTag; this.waiterButton = globalThis.document?.querySelector("#call-waiter"); }

  setTable(table) {
    this.tableTag.hidden = !table;
    this.tableTag.textContent = table?.nombre || "";
    if (this.waiterButton) this.waiterButton.hidden = !table;
  }

  render(html, focus = false) {
    globalThis.document?.body?.classList.remove("sheet-open");
    this.root.innerHTML = html;
    if (focus) this.root.focus({ preventScroll: true });
  }

  loading(message) {
    this.render(`<div class="loading" role="status"><span class="spinner" aria-hidden="true"></span><p>${escape(message)}</p></div>`);
  }

  state(title, message, retry = false) {
    this.render(`<section class="center-state panel"><div class="symbol" aria-hidden="true">!</div><h1>${escape(title)}</h1><p>${escape(message)}</p>${retry ? '<button class="btn btn-primary" data-action="retry">Volver a intentar</button>' : ""}</section>`, true);
  }

  home() {
    this.setTable(null);
    this.render(`<section class="center-state panel"><p class="eyebrow">DEVORA</p><h1>Comparte la mesa, no la confusión.</h1><p>Para comenzar en otra mesa, escanea su código QR con la cámara de tu celular o abre el enlace que te entregue el restaurante.</p><p class="helper">No necesitas activar la cámara dentro de esta página.</p></section>`, true);
  }

  name(table, value = "", error = "", busy = false) {
    this.render(`<section class="access-panel"><p class="eyebrow">Tu mesa está lista · Paso 1 de 3</p><h1>¡Bienvenido a ${escape(table.nombre)}!</h1><p class="lead">Comparte la mesa, no la confusión. Escribe tu nombre o apodo para identificar tu pedido individual.</p>
      <form id="name-form" class="panel" novalidate><div class="field"><label for="guest-name">Nombre o apodo</label><input id="guest-name" name="name" type="text" maxlength="40" minlength="2" autocomplete="nickname" placeholder="Por ejemplo, Alejandra" value="${escape(value)}" aria-describedby="name-help name-error" aria-invalid="${Boolean(error)}" ${busy ? "disabled" : ""}/><p class="helper" id="name-help">Entre 2 y 40 caracteres.</p><p id="name-error" class="error-text" role="alert">${escape(error)}</p></div><button class="btn btn-primary btn-full" type="submit" ${busy ? "disabled" : ""}>${busy ? "Guardando…" : "Continuar al menú"}</button></form>
    </section>`, true);
    if (!busy) this.root.querySelector("#guest-name")?.focus({ preventScroll: true });
  }

  menu({ table, guest, products, cart, category = null, order = null, summaryOpen = false, error = "", busy = false, demo = false }) {
    const groups = new Map();
    for (const product of products) {
      const category = product.categoria || "Menú";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(product);
    }
    const selected = groups.has(category) ? category : groups.keys().next().value;
    const tabs = `<div class="category-tabs" role="group" aria-label="Categorías del menú">${[...groups].map(([name, list]) => `<button type="button" class="category-tab" data-action="category" data-category="${escape(name)}" aria-pressed="${name === selected}" aria-controls="category-panel">${escape(name)} <span>${list.length}</span></button>`).join("")}</div>`;
    const shown = groups.get(selected) || [];
    const cards = `${tabs}<section class="category-panel" id="category-panel" aria-labelledby="category-title"><div class="category-head"><h2 id="category-title">${escape(selected)}</h2><p>${shown.length} ${shown.length === 1 ? "producto" : "productos"}</p></div><div class="product-list">${shown.map((p) => this.product(p, cart.get(p.id), busy, demo)).join("")}</div></section>`;
    const estimated = (order?.total || 0) + cart.total(products);
    const sheet = summaryOpen ? this.summaryHtml({ table, guest, products, cart, order, error, busy }) : "";
    this.render(`<section><div class="section-top"><div><p class="eyebrow">${escape(table.nombre)} · Paso 2 de 3</p><h1>¿Qué se te antoja?</h1><p>Elige tus productos y revisa tu total individual.</p></div><span class="person-pill">${escape(guest.nombre)}</span></div>
      ${demo ? '<p class="notice">Modo demostración: este pedido no se registra en un servidor.</p>' : ""}
      ${error && !summaryOpen ? `<p class="notice error" role="alert">${escape(error)}</p>` : ""}
      <div class="menu-content">${products.length ? cards : '<div class="panel"><h2>Menú vacío</h2><p>Este restaurante aún no tiene productos para pedir.</p></div>'}</div>
      <div class="order-bar"><div class="order-bar-meta"><span id="order-count">${this.countText(cart, order)}</span><strong id="order-total">${money(estimated)}</strong></div><div class="order-bar-actions"><button type="button" class="btn btn-primary" data-action="open-summary" aria-haspopup="dialog" aria-expanded="${summaryOpen}">Ver mi pedido <span aria-hidden="true">⌃</span></button>${order ? '<button type="button" class="btn btn-secondary" data-action="pay-confirmed">Pagar mi consumo</button>' : ""}</div></div>
      ${sheet}
    </section>`, false);
    globalThis.document?.body?.classList.toggle("sheet-open", summaryOpen);
  }

  summaryHtml({ table, guest, products, cart, order, error = "", busy = false }) {
    const items = cart.items(products);
    const previous = order?.detalles || [];
    const estimated = (order?.total || 0) + cart.total(products);
    return `<div class="sheet-wrap"><button class="sheet-backdrop" data-action="close-summary" aria-label="Cerrar resumen"></button><section class="order-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="sheet-handle" aria-hidden="true"></div><div class="sheet-head"><div><p class="eyebrow">${escape(table.nombre)} · ${escape(guest.nombre)}</p><h2 id="sheet-title">Tu pedido</h2></div><button class="sheet-close" type="button" data-action="close-summary" aria-label="Cerrar resumen">×</button></div>
      <div class="sheet-body">${error ? `<p class="notice error" role="alert">${escape(error)}</p>` : ""}
      ${previous.length ? `<h3 class="sheet-subtitle">Ya confirmado</h3><ul class="summary-list">${previous.map((item) => `<li><span>${item.cantidad} × ${escape(item.nombre)}</span><strong>${money(item.subtotal)}</strong></li>`).join("")}</ul>` : ""}
      <h3 class="sheet-subtitle">${order ? "Para añadir ahora" : "Tu selección"}</h3>
      ${items.length ? `<ul class="summary-list">${items.map((item) => `<li><span>${item.cantidad} × ${escape(item.nombre)}</span><strong>${money(item.subtotal)}</strong></li>`).join("")}</ul>` : '<p class="empty-cart">Todavía no elegiste productos. Agrega algo del menú para continuar.</p>'}
      <div class="summary-total"><span>${order ? "Total acumulado estimado" : "Total estimado"}</span><strong>${money(estimated)}</strong></div>
      <p class="summary-note">Los precios de los nuevos productos son estimados. El servidor confirma el total final.</p></div>
      <div class="sheet-actions"><button class="btn btn-primary btn-full" data-action="confirm" ${items.length === 0 || busy ? "disabled" : ""}>${busy ? "Registrando…" : order ? "Confirmar y enviar a cocina" : "Confirmar pedido y enviar a cocina"}</button>${order ? '<button class="btn btn-secondary btn-full" data-action="pay-confirmed">Pagar mi consumo confirmado</button>' : ""}</div>
    </section></div>`;
  }

  openSummary(data) {
    this.root.querySelector("section")?.insertAdjacentHTML("beforeend", this.summaryHtml(data));
    this.root.querySelector('[data-action="open-summary"]')?.setAttribute("aria-expanded", "true");
    globalThis.document?.body?.classList.add("sheet-open");
    this.root.querySelector(".sheet-close")?.focus({ preventScroll: true });
  }

  closeSummary() {
    this.root.querySelector(".sheet-wrap")?.remove();
    this.root.querySelector('[data-action="open-summary"]')?.setAttribute("aria-expanded", "false");
    globalThis.document?.body?.classList.remove("sheet-open");
  }

  countText(cart, order) {
    const count = cart.count();
    if (order && count === 0) return "Total confirmado";
    return `${count} ${count === 1 ? "producto nuevo" : "productos nuevos"} · ${order ? "Total estimado" : "Estimado"}`;
  }

  updateCart(button, product, amount, cart, products, order) {
    const foot = button.closest(".product")?.querySelector(".product-foot");
    if (foot) foot.innerHTML = this.productFoot(product, amount, false);
    const count = this.root.querySelector("#order-count");
    const total = this.root.querySelector("#order-total");
    if (count) count.textContent = this.countText(cart, order);
    if (total) total.textContent = money((order?.total || 0) + cart.total(products));
  }

  updateDetailQty(product, amount) {
    const actions = this.root.querySelector(".detail-actions");
    if (actions) actions.innerHTML = this.detailActions(product, amount);
  }

  product(product, amount, busy, demo) {
    const id = escape(product.id);
    return `<article class="product ${product.disponible ? "" : "unavailable"}"><button class="product-open" type="button" data-action="detail" data-id="${id}" aria-label="Ver detalles de ${escape(product.nombre)}"><span class="product-thumb">${product.imagenUrl ? `<img src="${escape(product.imagenUrl)}" alt="" loading="lazy" />` : '<span class="image-missing">Foto por confirmar</span>'}</span><span class="product-copy"><span class="product-title">${escape(product.nombre)}</span><span class="product-description">${escape(product.descripcion || "")}</span><span class="time-chip">${escape(timeText(product))}${demo && product.tiempoEstimado ? " · de muestra" : ""}</span></span><strong class="price">${money(product.precio)}</strong></button>
      <div class="product-foot">${this.productFoot(product, amount, busy)}</div>
    </article>`;
  }

  productFoot(product, amount, busy) {
    const id = escape(product.id);
    if (!product.disponible) return '<span class="stock-note">No disponible por ahora</span>';
    const control = amount
      ? `<div class="qty" aria-label="Cantidad de ${escape(product.nombre)}"><button type="button" data-action="minus" data-id="${id}" aria-label="Quitar una unidad de ${escape(product.nombre)}" ${busy ? "disabled" : ""}>−</button><output aria-live="polite">${amount}</output><button type="button" data-action="plus" data-id="${id}" aria-label="Agregar una unidad de ${escape(product.nombre)}" ${amount >= 99 || busy ? "disabled" : ""}>+</button></div>`
      : `<button class="btn btn-secondary add-btn" type="button" data-action="plus" data-id="${id}" ${busy ? "disabled" : ""}>+ Agregar</button>`;
    return `<span class="stock-note">Disponible</span>${control}`;
  }

  detail(table, product, amount, demo) {
    const ingredients = product.ingredientes.length
      ? `<ul class="ingredient-list">${product.ingredientes.map((part) => `<li>${escape(part)}</li>`).join("")}</ul>`
      : `<p>${escape(product.descripcion || "El restaurante aún no detalló los ingredientes de este producto.")}</p>`;
    this.render(`<section class="detail"><button class="detail-back" type="button" data-action="back-menu">← Volver al menú</button>
      <div class="detail-layout"><div class="detail-photo">${product.imagenUrl ? `<img src="${escape(product.imagenUrl)}" alt="${escape(demo ? "Foto ilustrativa de " : "Fotografía de ")}${escape(product.nombre)}" />` : '<div class="image-missing">Foto por confirmar</div>'}${demo && product.imagenUrl ? '<span class="photo-note">Imagen ilustrativa de la demo</span>' : ""}</div>
      <div class="detail-content"><p class="eyebrow">${escape(product.categoria || "Menú")} · ${escape(table.nombre)}</p><h1>${escape(product.nombre)}</h1><p class="lead">${escape(product.descripcion)}</p><div class="detail-facts"><strong>${money(product.precio)}</strong><span>${escape(timeText(product))}${demo && product.tiempoEstimado ? " · tiempo de muestra" : ""}</span></div>
      <div class="panel detail-ingredients"><h2>${product.ingredientes.length ? "¿Qué contiene?" : "Descripción"}</h2>${ingredients}</div>
      <div class="field"><label for="special-note">Indicaciones para tu plato <span class="soon">Próximamente</span></label><textarea id="special-note" rows="3" placeholder="Aquí podrás pedir algo extra o quitar un ingrediente" aria-describedby="special-help" disabled></textarea><p class="helper" id="special-help">Esta opción estará disponible en una próxima versión. Por ahora, consulta al mesero si necesitas un cambio.</p></div>
      <div class="detail-actions">${this.detailActions(product, amount)}</div>
      </div></div></section>`, true);
  }

  detailActions(product, amount) {
    const id = escape(product.id);
    if (!product.disponible) return '<p class="notice">Este producto no está disponible por ahora.</p>';
    if (!amount) return `<button class="btn btn-primary" type="button" data-action="plus" data-id="${id}">Agregar a mi pedido</button>`;
    return `<div class="qty" aria-label="Cantidad de ${escape(product.nombre)}"><button type="button" data-action="minus" data-id="${id}" aria-label="Quitar una unidad de ${escape(product.nombre)}">−</button><output aria-live="polite">${amount}</output><button type="button" data-action="plus" data-id="${id}" aria-label="Agregar una unidad de ${escape(product.nombre)}" ${amount >= 99 ? "disabled" : ""}>+</button></div>`;
  }

  confirmPay(table, order, newItems) {
    this.render(`<section class="receipt"><p class="eyebrow">${escape(table.nombre)} · Antes de pagar</p><h1>¿Pagar solo lo confirmado?</h1><p class="lead">Tienes productos elegidos que aún no enviaste a cocina. Si continúas al pago, estos productos se quitarán de tu selección.</p>
      <div class="panel"><h2>Sin confirmar</h2><ul class="summary-list">${newItems.map((item) => `<li><span>${item.cantidad} × ${escape(item.nombre)}</span><strong>${money(item.subtotal)}</strong></li>`).join("")}</ul>
      <div class="receipt-total"><span>Consumo confirmado para pagar</span><strong>${money(order.total)}</strong></div>
      <div class="receipt-actions"><button class="btn btn-secondary" data-action="keep-selecting">Seguir eligiendo</button><button class="btn btn-primary" data-action="discard-and-pay">Quitar selección y pagar</button></div></div>
    </section>`, true);
  }

  receipt(table, guest, order, demo) {
    const date = order.fecha ? new Date(order.fecha) : null;
    const dateText = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(date) : "No indicada";
    this.render(`<section class="receipt"><div class="receipt-head"><span class="check-mark" aria-hidden="true">✓</span><p class="eyebrow">Paso 3 de 3</p><h1>${demo ? "Pedido de demostración" : "¡Pedido registrado!"}</h1><p>${demo ? "Este pedido se creó solo en el modo de prueba." : "Tu pedido ya fue enviado. Aquí está tu consumo individual."}</p></div>
      <div class="panel"><div class="receipt-meta"><div><small>Mesa</small><strong>${escape(table.nombre)}</strong></div><div><small>Comensal</small><strong>${escape(guest.nombre)}</strong></div><div><small>Número de pedido</small><strong>${escape(order.id || "No indicado")}</strong></div><div><small>Fecha y hora</small><strong>${escape(dateText)}</strong></div></div>
      <h2>Detalle de tu pedido</h2><ul class="receipt-items">${order.detalles.map((item) => `<li><span><b>${item.cantidad} × ${escape(item.nombre)}</b><small>${money(item.precio)} por unidad</small></span><strong>${money(item.subtotal)}</strong></li>`).join("")}</ul>
      <div class="receipt-total"><span>Total individual</span><strong>${money(order.total)}</strong></div><p class="notice success">Estado del pedido: <strong>${escape(label(order.estado))}</strong></p><p class="summary-note">Este registro no indica que se haya realizado un pago.</p>
      <div class="receipt-actions"><button class="btn btn-secondary" data-action="add-more">Pedir algo más</button><button class="btn btn-primary" data-action="start-payment">Pagar mi consumo</button>${!demo && order.id ? '<button class="btn btn-secondary" data-action="refresh-order">Actualizar estado</button>' : ""}</div></div>
    </section>`, true);
  }

  payment(table, order, checkout, error = "", busy = false, demo = false) {
    this.render(`<section class="receipt"><p class="eyebrow">${escape(table.nombre)} · Pago individual</p><h1>¿Cómo prefieres pagar?</h1><p>Tu consumo confirmado es <strong>${money(order.total)}</strong>. Elige un método para continuar.</p>
      ${demo ? '<p class="notice">Modo demostración: aquí no se realizan cobros reales.</p>' : ""}
      ${error ? `<p class="notice error" role="alert">${escape(error)}</p>` : ""}
      <div class="method-list" role="group" aria-label="Método de pago">
        <button type="button" class="method-card" data-action="method" data-method="efectivo" aria-pressed="${checkout.method === "efectivo"}" ${busy ? "disabled" : ""}><strong>Efectivo</strong><span>Solicitar que el mesero se acerque a cobrar.</span></button>
        <button type="button" class="method-card" data-action="method" data-method="qr" aria-pressed="${checkout.method === "qr"}" ${busy ? "disabled" : ""}><strong>QR</strong><span>Mostrar el código que entregue el restaurante.</span></button>
      </div>
      ${checkout.method ? `<div class="panel pay-panel"><h2>${checkout.method === "efectivo" ? "Pago en efectivo" : "Pago con QR"}</h2><div class="pay-row"><span>Consumo confirmado</span><strong>${money(order.total)}</strong></div>
        <div class="field"><label for="tip-input">Propina para el mesero (opcional)</label><input id="tip-input" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${escape(checkout.tipText)}" aria-describedby="tip-help tip-error" aria-invalid="${Boolean(checkout.error)}" ${busy ? "disabled" : ""}/><p class="helper" id="tip-help">Un gesto si lo deseas. No es una obligación; cualquier monto está bien.</p><p class="error-text" id="tip-error" role="alert">${escape(checkout.error)}</p></div>
        <div class="pay-row"><span>Propina</span><strong id="tip-amount">${money(checkout.tip())}</strong></div><div class="pay-row pay-grand"><span>Total a pagar estimado</span><strong id="pay-total">${money(checkout.total())}</strong></div>
        <p class="summary-note">El servidor confirmará el importe final antes del cobro.</p><button class="btn btn-primary btn-full" data-action="pay" ${busy || checkout.error ? "disabled" : ""}>${busy ? "Preparando pago…" : checkout.method === "efectivo" ? "Solicitar cobro en efectivo" : "Generar QR para pagar"}</button></div>` : ""}
      <button class="btn btn-secondary payment-back" data-action="back-receipt" ${busy ? "disabled" : ""}>Volver a mi pedido</button>
    </section>`, true);
  }

  pending(table, payment, demo = false, error = "") {
    const cash = payment.metodo === "efectivo";
    const qr = qrImage(payment.qrUrl);
    this.render(`<section class="receipt"><div class="receipt-head"><p class="eyebrow">${escape(table.nombre)} · Pago pendiente</p><h1>${cash ? "El mesero va en camino" : qr ? "Tu QR de pago" : "Pago con QR pendiente"}</h1><p>${cash ? demo ? "Simulamos que el mesero viene a cobrarte. En unos 20 segundos verás la despedida. No se realizará un cobro real." : "Avisamos al mesero para que se acerque a cobrarte. El pago seguirá pendiente hasta que el restaurante lo confirme." : demo ? "La demostración no genera un QR bancario válido." : qr ? "Escanea el QR proporcionado por el restaurante. Verificaremos el pago antes de cerrar tu sesión." : "El restaurante todavía no entregó el código QR. Verifica de nuevo o pide ayuda al personal."}</p></div>
      <div class="panel">${error ? `<p class="notice error" role="alert">${escape(error)}</p>` : ""}
        ${!cash && qr ? `<div class="qr-wrap"><img src="${escape(qr)}" alt="Código QR de pago entregado por el servidor" /></div>` : !cash ? '<p class="notice">El servidor aún no entregó un QR válido. Actualiza el estado o pide ayuda al personal.</p>' : ""}
        <div class="pay-row"><span>Consumo</span><strong>${money(payment.totalPagar - payment.propina)}</strong></div><div class="pay-row"><span>Propina voluntaria</span><strong>${money(payment.propina)}</strong></div><div class="pay-row pay-grand"><span>Total</span><strong>${money(payment.totalPagar)}</strong></div>
        <p class="notice">Estado: <strong>${cash ? "Pendiente de cobro" : "Pendiente de pago"}</strong>. Todavía no se registró como pagado.</p>
        ${cash && demo ? "" : `<div class="receipt-actions"><button class="btn btn-primary" data-action="check-payment">${cash ? "Verificar estado" : demo ? "Confirmar pago de prueba" : "Verificar pago"}</button></div>`}
      </div>
    </section>`, true);
  }

  thankYou(demo = false, method = "") {
    this.setTable(null);
    const demoText = method === "efectivo" ? "El cobro en efectivo se confirmó solo en esta demostración." : "El pago se confirmó solo en esta demostración.";
    this.render(`<section class="center-state panel"><span class="check-mark" aria-hidden="true">✓</span><p class="eyebrow">DEVORA</p><h1>Gracias por tu visita</h1>${demo ? `<p class="notice">${demoText} No se realizó un pago real.</p>` : ""}<p>¡Te esperamos otro día! Tu sesión de esta mesa se cerró. Para pedir en otra, abre su QR con la cámara de tu celular.</p><button class="btn btn-primary" data-action="home">Volver al inicio</button></section>`, true);
  }
}
