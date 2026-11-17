/** Contrato de los datos del módulo comensal. */
export class IRepositorioComensal {
  getMesa() { throw new Error("Debe implementarse getMesa"); }
  getMenu() { throw new Error("Debe implementarse getMenu"); }
  registerGuest() { throw new Error("Debe implementarse registerGuest"); }
  createOrder() { throw new Error("Debe implementarse createOrder"); }
  addItems() { throw new Error("Debe implementarse addItems"); }
  requestPayment() { throw new Error("Debe implementarse requestPayment"); }
  getPayment() { throw new Error("Debe implementarse getPayment"); }
  getOrder() { throw new Error("Debe implementarse getOrder"); }
  callWaiter() { throw new Error("Debe implementarse callWaiter"); }
}
