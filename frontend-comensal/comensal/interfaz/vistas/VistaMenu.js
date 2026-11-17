import { escape, formatearDinero, timeText, label, qrImage } from "./UtilidadesVista.js";

export class VistaMenu {

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
  
      ${error && !summaryOpen ? `<p class="notice error" role="alert">${escape(error)}</p>` : ""}
      <div class="menu-content">${products.length ? cards : '<div class="panel"><h2>Menú vacío</h2><p>Este restaurante aún no tiene productos para pedir.</p></div>'}</div>
      <div class="order-bar"><div class="order-bar-meta"><span id="order-count">${this.countText(cart, order)}</span><strong id="order-total">${formatearDinero(estimated)}</strong></div><div class="order-bar-actions"><button type="button" class="btn btn-primary" data-action="open-summary" aria-haspopup="dialog" aria-expanded="${summaryOpen}">Ver mi pedido <span aria-hidden="true">⌃</span></button>${order ? '<button type="button" class="btn btn-secondary" data-action="pay-confirmed">Pagar mi consumo</button>' : ""}</div></div>
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
      ${previous.length ? `<h3 class="sheet-subtitle">Ya confirmado</h3><ul class="summary-list">${previous.map((item) => `<li><span>${item.cantidad} × ${escape(item.nombre)}</span><strong>${formatearDinero(item.subtotal)}</strong></li>`).join("")}</ul>` : ""}
      <h3 class="sheet-subtitle">${order ? "Para añadir ahora" : "Tu selección"}</h3>
      ${items.length ? `<ul class="summary-list">${items.map((item) => `<li><span>${item.cantidad} × ${escape(item.nombre)}</span><strong>${formatearDinero(item.subtotal)}</strong></li>`).join("")}</ul>` : '<p class="empty-cart">Todavía no elegiste productos. Agrega algo del menú para continuar.</p>'}
      <div class="summary-total"><span>${order ? "Total acumulado estimado" : "Total estimado"}</span><strong>${formatearDinero(estimated)}</strong></div>
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
    if (total) total.textContent = formatearDinero((order?.total || 0) + cart.total(products));
  }

  updateDetailQty(product, amount) {
    const actions = this.root.querySelector(".detail-actions");
    if (actions) actions.innerHTML = this.detailActions(product, amount);
  }

  product(product, amount, busy, demo) {
    const id = escape(product.id);
    return `<article class="product ${product.disponible ? "" : "unavailable"}"><button class="product-open" type="button" data-action="detail" data-id="${id}" aria-label="Ver detalles de ${escape(product.nombre)}"><span class="product-thumb">${product.imagenUrl ? `<img src="${escape(product.imagenUrl)}" alt="" loading="lazy" />` : '<span class="image-missing">Foto por confirmar</span>'}</span><span class="product-copy"><span class="product-title">${escape(product.nombre)}</span><span class="product-description">${escape(product.descripcion || "")}</span><span class="time-chip">${escape(timeText(product))}${demo && product.tiempoEstimado ? " · de muestra" : ""}</span></span><strong class="price">${formatearDinero(product.precio)}</strong></button>
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
      <div class="detail-content"><p class="eyebrow">${escape(product.categoria || "Menú")} · ${escape(table.nombre)}</p><h1>${escape(product.nombre)}</h1><p class="lead">${escape(product.descripcion)}</p><div class="detail-facts"><strong>${formatearDinero(product.precio)}</strong><span>${escape(timeText(product))}${demo && product.tiempoEstimado ? " · tiempo de muestra" : ""}</span></div>
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
}
