import { config } from "../../configuracion/Configuracion.js";
import { CarritoCompras } from "../../dominio/modelos/CarritoCompras.js";
import { CalculadoraCuenta } from "../../dominio/modelos/CalculadoraCuenta.js";
import { formatearDinero } from "../../../interfaz/vistas/VistaComensal.js";
import { obtenerMesaDesdeUrl, validarNombre, validarProductos, validarPedido, validarPago, esperaCobroEfectivo } from "../../dominio/modelos/Validaciones.js";


export class ControladorSesion {
  loadSession() { return this.almacenamiento.cargar(); }

  saveSession() { this.almacenamiento.guardar({ name: this.session.name || "", guest: this.guest, cart: this.cart.snapshot(), order: this.order, payment: this.payment }); }

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
        this.programarConfirmacionDemo();
      }
      else if (this.order?.id && this.guest?.id) this.view.receipt(this.table, this.guest, this.order, config.demo);
      else if (this.guest?.id) await this.loadMenu();
      else this.view.name(this.table, this.session.name || "");
    } catch (error) { this.view.state("Sin conexión", error.message, true); }
  }
}
