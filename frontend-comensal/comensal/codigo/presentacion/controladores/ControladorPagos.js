import { config } from "../../configuracion/Configuracion.js";
import { CarritoCompras } from "../../dominio/modelos/CarritoCompras.js";
import { CalculadoraCuenta } from "../../dominio/modelos/CalculadoraCuenta.js";
import { formatearDinero } from "../../../interfaz/vistas/VistaComensal.js";
import { obtenerMesaDesdeUrl, validarNombre, validarProductos, validarPedido, validarPago, esperaConfirmacionPagoDemo } from "../../dominio/modelos/Validaciones.js";


export class ControladorPagos {
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
    this.checkout = new CalculadoraCuenta(this.order.total);
    this.view.payment(this.table, this.order, this.checkout, "", false, config.demo);
  }

  async requestPayment() {
    if (!this.order?.id || !this.checkout?.method || this.checkout.error) return;
    this.busy = true;
    this.view.payment(this.table, this.order, this.checkout, "", true, config.demo);
    try {
      this.payment = validarPago(await this.api.requestPayment(this.order.id, this.checkout.method, this.checkout.tip()));
      this.saveSession();
      if (this.payment.estado === "pagado") this.finishPayment();
      else {
        this.view.pending(this.table, this.payment, config.demo);
        this.programarConfirmacionDemo();
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
      this.payment = validarPago(response);
      this.saveSession();
      if (this.payment.estado === "pagado") this.finishPayment();
      else this.view.pending(this.table, this.payment, config.demo, "El pago aún no está confirmado. Puedes verificarlo de nuevo en unos momentos.");
    } catch (error) {
      this.view.pending(this.table, this.payment, config.demo, error.message || "No se pudo verificar el pago.");
    } finally { this.busy = false; }
  }

  programarConfirmacionDemo() {
    clearTimeout(this.temporizadorPago);
    if (!config.demo || !["efectivo", "qr"].includes(this.payment?.metodo) || !["pendiente_cobro", "pendiente_pago"].includes(this.payment.estado)) return;
    const id = this.payment.id;
    this.temporizadorPago = setTimeout(async () => {
      if (this.payment?.id !== id || !["pendiente_cobro", "pendiente_pago"].includes(this.payment.estado)) return;
      try {
        const confirmed = validarPago(await this.api.confirmDemoPayment(id));
        if (this.payment?.id !== id) return;
        this.payment = confirmed;
        this.saveSession();
        this.finishPayment();
      } catch {
        this.view.pending(this.table, this.payment, true, "No se pudo terminar la simulación. Recarga la página para intentarlo de nuevo.");
      }
    }, esperaConfirmacionPagoDemo(this.payment));
  }

  finishPayment() {
    if (this.payment?.estado !== "pagado") return;
    clearTimeout(this.temporizadorPago);
    const method = this.payment.metodo;
    if (config.demo) this.api.endSession(this.order?.id, this.payment.id);
    this.almacenamiento.borrar();
    this.session = {};
    this.cart = new CarritoCompras();
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

