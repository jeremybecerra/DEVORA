import { IRepositorioComensal } from "../../dominio/contratos/IRepositorioComensal.js";
import { ClienteHttp } from "../comunicacion/ClienteHttp.js";
/** Repositorio que delega la persistencia al servidor (no accede directamente a MySQL). */
export class RepositorioComensalHttp extends IRepositorioComensal {
  constructor(cliente = new ClienteHttp()) { super(); this.cliente = cliente; }
  getMesa(id) { return this.cliente.getMesa(id); }
  getMenu() { return this.cliente.getMenu(); }
  registerGuest(mesaId, nombre) { return this.cliente.registerGuest(mesaId, nombre); }
  createOrder(mesaId, comensalId, items) { return this.cliente.createOrder(mesaId, comensalId, items); }
  addItems(id, items) { return this.cliente.addItems(id, items); }
  requestPayment(id, metodo, propina) { return this.cliente.requestPayment(id, metodo, propina); }
  getPayment(id) { return this.cliente.getPayment(id); }
  getOrder(id) { return this.cliente.getOrder(id); }
  callWaiter(mesaId, comensalId) { return this.cliente.callWaiter(mesaId, comensalId); }
}
