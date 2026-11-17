import { IRepositorioComensal } from "../../dominio/contratos/IRepositorioComensal.js";
import { ServicioDatosSimulados } from "../simulacion/ServicioDatosSimulados.js";
/** Mismo contrato de acceso a datos, sin conexión de backend. */
export class RepositorioComensalSimulado extends IRepositorioComensal {
  constructor(servicio = new ServicioDatosSimulados()) { super(); this.servicio = servicio; }
  getMesa(id) { return this.servicio.getMesa(id); }
  getMenu() { return this.servicio.getMenu(); }
  registerGuest(mesaId, nombre) { return this.servicio.registerGuest(mesaId, nombre); }
  createOrder(mesaId, comensalId, items) { return this.servicio.createOrder(mesaId, comensalId, items); }
  addItems(id, items) { return this.servicio.addItems(id, items); }
  requestPayment(id, metodo, propina) { return this.servicio.requestPayment(id, metodo, propina); }
  getPayment(id) { return this.servicio.getPayment(id); }
  getOrder(id) { return this.servicio.getOrder(id); }
  callWaiter(mesaId, comensalId) { return this.servicio.callWaiter(mesaId, comensalId); }
  confirmDemoPayment(id) { return this.servicio.confirmDemoPayment(id); }
  endSession(orderId, paymentId) { return this.servicio.endSession(orderId, paymentId); }
}
