import { config } from "../../configuracion/Configuracion.js";
import { CarritoCompras } from "../../dominio/modelos/CarritoCompras.js";
import { CalculadoraCuenta } from "../../dominio/modelos/CalculadoraCuenta.js";
import { formatearDinero } from "../../../interfaz/vistas/VistaComensal.js";
import { obtenerMesaDesdeUrl, validarNombre, validarProductos, validarPedido, validarPago, esperaCobroEfectivo } from "../../dominio/modelos/Validaciones.js";


export class ControladorEventos {
  status(message, error = false) {
    clearTimeout(this.statusTimer);
    const element = document.querySelector("#global-status");
    element.textContent = message;
    element.classList.toggle("error", error);
    element.hidden = !message;
    if (message) this.statusTimer = setTimeout(() => this.status(""), 8000);
  }

  onInput(event) {
    if (event.target.id !== "tip-input" || !this.checkout) return;
    this.checkout.setTip(event.target.value);
    event.target.setAttribute("aria-invalid", String(Boolean(this.checkout.error)));
    this.view.root.querySelector("#tip-error").textContent = this.checkout.error;
    this.view.root.querySelector("#tip-amount").textContent = formatearDinero(this.checkout.tip());
    this.view.root.querySelector("#pay-total").textContent = formatearDinero(this.checkout.total());
    this.view.root.querySelector('[data-action="pay"]').disabled = Boolean(this.checkout.error);
  }

  onKeydown(event) {
    if (!this.summaryOpen) return;
    if (event.key === "Escape") { event.preventDefault(); this.closeSummary(); return; }
    if (event.key !== "Tab") return;
    const buttons = [...this.view.root.querySelectorAll('.order-sheet button:not([disabled])')];
    if (!buttons.length) return;
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  async onSubmit(event) {
    if (event.target.id !== "name-form") return;
    event.preventDefault();
    if (this.busy) return;
    const raw = event.target.elements.name.value;
    const { name, error } = validarNombre(raw);
    if (error) { this.view.name(this.table, raw, error); return; }
    this.session.name = name;
    this.busy = true;
    this.view.name(this.table, name, "", true);
    try {
      const guest = await this.api.registerGuest(this.tableId, name);
      if (guest?.id == null) throw new Error("El servidor no confirmó la identificación del comensal.");
      this.guest = { id: guest.id, nombre: guest.nombre || name };
      this.saveSession();
      this.busy = false;
      await this.loadMenu();
    } catch (failure) { this.view.name(this.table, name, failure.message); }
    finally { this.busy = false; }
  }

  async onClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button || this.busy) return;
    const action = button.dataset.action;
    if (action === "retry") { this.init(); return; }
    if (action === "call-waiter") { await this.callWaiter(button); return; }
    if (action === "open-summary") {
      this.summaryOpen = true;
      this.view.openSummary({ table: this.table, guest: this.guest, products: this.products, cart: this.cart, order: this.order, busy: this.busy });
      return;
    }
    if (action === "close-summary") { this.closeSummary(); return; }
    if (action === "pay-confirmed") { this.startPayment(); return; }
    if (action === "keep-selecting") { this.showMenu(); return; }
    if (action === "discard-and-pay") {
      this.cart = new CarritoCompras();
      this.saveSession();
      this.openPayment();
      return;
    }
    if (action === "detail") { this.detailId = button.dataset.id; this.showDetail(); return; }
    if (action === "back-menu") {
      const lastId = this.detailId;
      this.detailId = null;
      this.showMenu();
      this.view.root.querySelector(`[data-action="detail"][data-id="${CSS.escape(String(lastId))}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (action === "category") {
      this.category = button.dataset.category;
      this.showMenu();
      this.view.root.querySelector('[data-action="category"][aria-pressed="true"]')?.focus({ preventScroll: true });
      return;
    }
    if (action === "plus" || action === "minus") {
      const product = this.products.find((p) => String(p.id) === button.dataset.id);
      if (!product?.disponible) return;
      const next = this.cart.get(product.id) + (action === "plus" ? 1 : -1);
      if (this.cart.set(product.id, next)) {
        this.saveSession();
        if (this.detailId) this.view.updateDetailQty(product, next);
        else this.view.updateCart(button, product, next, this.cart, this.products, this.order);
        const focusAction = action === "minus" && next === 0 ? "plus" : action;
        this.view.root.querySelector(`[data-action="${focusAction}"][data-id="${CSS.escape(String(product.id))}"]`)?.focus({ preventScroll: true });
      }
      return;
    }
    if (action === "confirm") { await this.confirm(); return; }
    if (action === "add-more") { await this.loadMenu(); return; }
    if (action === "start-payment") { this.startPayment(); return; }
    if (action === "method") { this.checkout?.setMethod(button.dataset.method); this.view.payment(this.table, this.order, this.checkout, "", false, config.demo); this.view.root.querySelector(`[data-method="${button.dataset.method}"]`)?.focus({ preventScroll: true }); return; }
    if (action === "back-receipt") { this.view.receipt(this.table, this.guest, this.order, config.demo); return; }
    if (action === "pay") { await this.requestPayment(); return; }
    if (action === "check-payment") { await this.checkPayment(); return; }
    if (action === "home") { location.assign("/"); return; }
    if (action === "refresh-order") { await this.refreshOrder(); }
  }
}
