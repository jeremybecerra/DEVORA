import { config } from "./config.js";
import { createApi } from "./api.js";
import { Cart } from "./cart.js";
import { Checkout } from "./checkout.js";
import { View, money } from "./view.js";
import { tableIdFromUrl, validName, validProducts, validOrder, validPayment, cashWaitMs } from "./model.js";

class GuestApp {
  constructor() {
    this.view = new View(document.querySelector("#app"), document.querySelector("#header-table"));
    this.api = createApi();
    this.tableId = tableIdFromUrl();
    this.storageKey = `devora:comensal:${config.demo ? "demo" : "api"}:${this.tableId}`;
    this.session = this.loadSession();
    this.cart = new Cart(this.session.cart);
    this.products = [];
    this.category = null;
    this.guest = this.session.guest || null;
    this.order = this.session.order || null;
    this.payment = this.session.payment || null;
    this.checkout = null;
    this.summaryOpen = false;
    this.detailId = null;
    this.busy = false;
    this.view.root.addEventListener("click", (event) => this.onClick(event));
    document.querySelector("#call-waiter").addEventListener("click", (event) => this.onClick(event));
    this.view.root.addEventListener("submit", (event) => this.onSubmit(event));
    this.view.root.addEventListener("input", (event) => this.onInput(event));
    this.view.root.addEventListener("keydown", (event) => this.onKeydown(event));
  }

  loadSession() {
    try { return JSON.parse(sessionStorage.getItem(this.storageKey) || "{}") || {}; }
    catch { return {}; }
  }

  saveSession() {
    try { sessionStorage.setItem(this.storageKey, JSON.stringify({ name: this.session.name || "", guest: this.guest, cart: this.cart.snapshot(), order: this.order, payment: this.payment })); }
    catch { /* Session storage is optional. */ }
  }

  async init() {
    if (!this.tableId || this.tableId.length > 60) {
      this.view.home();
      return;
    }
    this.view.loading("Comprobando la mesa…");
    try {
      this.table = await this.api.getMesa(this.tableId);
      if (!this.table) { this.view.state("Mesa no encontrada", "El enlace de esta mesa no existe. Pide ayuda al personal."); return; }
      if (String(this.table.estado).toLowerCase() !== "abierta") { this.view.state("Mesa cerrada", "Esta mesa no está disponible para recibir pedidos. Pide ayuda al personal."); return; }
      this.view.setTable(this.table);
      if (this.payment?.estado === "pagado") this.finishPayment();
      else if (this.payment?.id) {
        this.view.pending(this.table, this.payment, config.demo);
        this.scheduleCashDemo();
      }
      else if (this.order?.id && this.guest?.id) this.view.receipt(this.table, this.guest, this.order, config.demo);
      else if (this.guest?.id) await this.loadMenu();
      else this.view.name(this.table, this.session.name || "");
    } catch (error) { this.view.state("Sin conexión", error.message, true); }
  }

  async loadMenu() {
    this.summaryOpen = false;
    this.detailId = null;
    this.view.loading("Cargando el menú…");
    try {
      this.products = validProducts(await this.api.getMenu());
      const categories = [...new Set(this.products.map((p) => p.categoria || "Menú"))];
      if (!categories.includes(this.category)) this.category = categories[0] || null;
      const removed = this.cart.sync(this.products);
      this.saveSession();
      this.showMenu(removed ? "Algunos productos de tu selección ya no están disponibles y se quitaron del pedido." : "");
    } catch (error) { this.view.state("No se pudo cargar el menú", error.message, true); }
  }

  showMenu(error = "") {
    this.view.menu({ table: this.table, guest: this.guest, products: this.products, cart: this.cart, category: this.category, order: this.order, summaryOpen: this.summaryOpen, error, busy: this.busy, demo: config.demo });
    if (this.summaryOpen) this.view.root.querySelector(".sheet-close")?.focus({ preventScroll: true });
  }

  showDetail() {
    const product = this.products.find((item) => String(item.id) === this.detailId);
    if (!product) { this.detailId = null; this.showMenu(); return; }
    this.view.detail(this.table, product, this.cart.get(product.id), config.demo);
  }

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
    this.view.root.querySelector("#tip-amount").textContent = money(this.checkout.tip());
    this.view.root.querySelector("#pay-total").textContent = money(this.checkout.total());
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

  closeSummary() {
    this.summaryOpen = false;
    this.view.closeSummary();
    this.view.root.querySelector('[data-action="open-summary"]')?.focus({ preventScroll: true });
  }

  async onSubmit(event) {
    if (event.target.id !== "name-form") return;
    event.preventDefault();
    if (this.busy) return;
    const raw = event.target.elements.name.value;
    const { name, error } = validName(raw);
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
      this.cart = new Cart();
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

  async confirm() {
    const items = this.cart.items(this.products).map(({ productoId, cantidad }) => ({ productoId, cantidad }));
    if (!items.length) { this.showMenu("Agrega al menos un producto antes de confirmar."); return; }
    this.busy = true;
    this.showMenu();
    try {
      const response = this.order
        ? await this.api.addItems(this.order.id, items)
        : await this.api.createOrder(this.tableId, this.guest.id, items);
      this.order = validOrder(response);
      this.cart = new Cart();
      this.summaryOpen = false;
      this.saveSession();
      this.view.receipt(this.table, this.guest, this.order, config.demo);
    } catch (error) {
      this.busy = false;
      this.showMenu(error.message || "No se pudo registrar el pedido. Inténtalo de nuevo.");
    } finally { this.busy = false; }
  }

  startPayment() {
    if (!this.order?.id) return;
    this.summaryOpen = false;
    this.detailId = null;
    if (!this.cart.empty()) {
      this.view.confirmPay(this.table, this.order, this.cart.items(this.products));
      return;
    }
    this.openPayment();
  }

  openPayment() {
    this.checkout = new Checkout(this.order.total);
    this.view.payment(this.table, this.order, this.checkout, "", false, config.demo);
  }

  async callWaiter(button) {
    if (!this.tableId || !this.table) return;
    button.disabled = true;
    this.status("Avisando al mesero…");
    try {
      await this.api.callWaiter(this.tableId, this.guest?.id || null);
      this.status(config.demo ? "Demostración: la llamada al mesero fue simulada." : "Aviso enviado. El mesero se acercará a tu mesa.");
    } catch (error) {
      this.status(error.message || "No se pudo llamar al mesero. Inténtalo de nuevo o avisa al personal.", true);
    } finally { button.disabled = false; }
  }

  async refreshOrder() {
    if (!this.order?.id) return;
    this.busy = true;
    try {
      this.order = validOrder(await this.api.getOrder(this.order.id));
      this.saveSession();
      this.view.receipt(this.table, this.guest, this.order, config.demo);
    } catch (error) {
      this.view.receipt(this.table, this.guest, this.order, config.demo);
      this.view.root.querySelector(".receipt-head").insertAdjacentHTML("afterend", `<p class="notice error" role="alert">No se pudo actualizar el estado. El pedido mostrado es el último confirmado.</p>`);
    } finally { this.busy = false; }
  }

  async requestPayment() {
    if (!this.order?.id || !this.checkout?.method || this.checkout.error) return;
    this.busy = true;
    this.view.payment(this.table, this.order, this.checkout, "", true, config.demo);
    try {
      this.payment = validPayment(await this.api.requestPayment(this.order.id, this.checkout.method, this.checkout.tip()));
      this.saveSession();
      if (this.payment.estado === "pagado") this.finishPayment();
      else {
        this.view.pending(this.table, this.payment, config.demo);
        this.scheduleCashDemo();
      }
    } catch (error) {
      this.view.payment(this.table, this.order, this.checkout, error.message || "No se pudo solicitar el pago.", false, config.demo);
    } finally { this.busy = false; }
  }

  async checkPayment() {
    if (!this.payment?.id || (config.demo && this.payment.metodo === "efectivo")) return;
    this.busy = true;
    this.view.loading("Verificando el pago…");
    try {
      const response = config.demo
        ? await this.api.confirmDemoPayment(this.payment.id)
        : await this.api.getPayment(this.payment.id);
      this.payment = validPayment(response);
      this.saveSession();
      if (this.payment.estado === "pagado") this.finishPayment();
      else this.view.pending(this.table, this.payment, config.demo, "El pago aún no está confirmado. Puedes verificarlo de nuevo en unos momentos.");
    } catch (error) {
      this.view.pending(this.table, this.payment, config.demo, error.message || "No se pudo verificar el pago.");
    } finally { this.busy = false; }
  }

  scheduleCashDemo() {
    clearTimeout(this.cashTimer);
    if (!config.demo || this.payment?.metodo !== "efectivo" || this.payment.estado !== "pendiente_cobro") return;
    const id = this.payment.id;
    this.cashTimer = setTimeout(async () => {
      if (this.payment?.id !== id || this.payment.estado !== "pendiente_cobro") return;
      try {
        const confirmed = validPayment(await this.api.confirmDemoPayment(id));
        if (this.payment?.id !== id) return;
        this.payment = confirmed;
        this.saveSession();
        this.finishPayment();
      } catch {
        this.view.pending(this.table, this.payment, true, "No se pudo terminar la simulación. Recarga la página para intentarlo de nuevo.");
      }
    }, cashWaitMs(this.payment));
  }

  finishPayment() {
    if (this.payment?.estado !== "pagado") return;
    clearTimeout(this.cashTimer);
    const method = this.payment.metodo;
    if (config.demo) this.api.endSession(this.order?.id, this.payment.id);
    try { sessionStorage.removeItem(this.storageKey); }
    catch { /* El almacenamiento de sesión es opcional. */ }
    this.session = {};
    this.cart = new Cart();
    this.guest = null;
    this.order = null;
    this.payment = null;
    this.checkout = null;
    this.tableId = null;
    this.status("");
    history.replaceState({}, "", "/");
    this.view.thankYou(config.demo, method);
  }
}

new GuestApp().init();
