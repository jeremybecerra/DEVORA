import { config } from "../../configuracion/Configuracion.js";
import { CarritoCompras } from "../../dominio/modelos/CarritoCompras.js";
import { CalculadoraCuenta } from "../../dominio/modelos/CalculadoraCuenta.js";
import { formatearDinero } from "../../../interfaz/vistas/VistaComensal.js";
import { obtenerMesaDesdeUrl, validarNombre, validarProductos, validarPedido, validarPago, esperaCobroEfectivo } from "../../dominio/modelos/Validaciones.js";


export class ControladorMenu {
  async loadMenu() {
    this.summaryOpen = false;
    this.detailId = null;
    this.view.loading("Cargando el menú…");
    try {
      this.products = validarProductos(await this.api.getMenu());
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

  closeSummary() {
    this.summaryOpen = false;
    this.view.closeSummary();
    this.view.root.querySelector('[data-action="open-summary"]')?.focus({ preventScroll: true });
  }
}
