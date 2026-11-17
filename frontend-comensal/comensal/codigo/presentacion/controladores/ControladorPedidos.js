import { config } from "../../configuracion/Configuracion.js";
import { CarritoCompras } from "../../dominio/modelos/CarritoCompras.js";
import { CalculadoraCuenta } from "../../dominio/modelos/CalculadoraCuenta.js";
import { formatearDinero } from "../../../interfaz/vistas/VistaComensal.js";
import { obtenerMesaDesdeUrl, validarNombre, validarProductos, validarPedido, validarPago, esperaCobroEfectivo } from "../../dominio/modelos/Validaciones.js";


export class ControladorPedidos {
  async confirm() {
    const items = this.cart.items(this.products).map(({ productoId, cantidad }) => ({ productoId, cantidad }));
    if (!items.length) { this.showMenu("Agrega al menos un producto antes de confirmar."); return; }
    this.busy = true;
    this.showMenu();
    try {
      const response = this.order
        ? await this.api.addItems(this.order.id, items)
        : await this.api.createOrder(this.tableId, this.guest.id, items);
      this.order = validarPedido(response);
      this.cart = new CarritoCompras();
      this.summaryOpen = false;
      this.saveSession();
      this.view.receipt(this.table, this.guest, this.order, config.demo);
    } catch (error) {
      this.busy = false;
      this.showMenu(error.message || "No se pudo registrar el pedido. Inténtalo de nuevo.");
    } finally { this.busy = false; }
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
      this.order = validarPedido(await this.api.getOrder(this.order.id));
      this.saveSession();
      this.view.receipt(this.table, this.guest, this.order, config.demo);
    } catch (error) {
      this.view.receipt(this.table, this.guest, this.order, config.demo);
      this.view.root.querySelector(".receipt-head").insertAdjacentHTML("afterend", `<p class="notice error" role="alert">No se pudo actualizar el estado. El pedido mostrado es el último confirmado.</p>`);
    } finally { this.busy = false; }
  }
}
