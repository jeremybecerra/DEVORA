import { VistaBase } from "./VistaBase.js";
import { VistaAcceso } from "./VistaAcceso.js";
import { VistaMenu } from "./VistaMenu.js";
import { VistaPedidos } from "./VistaPedidos.js";
import { VistaPagos } from "./VistaPagos.js";
export { formatearDinero } from "./UtilidadesVista.js";

/** Fachada de presentación. Cada grupo de pantallas se mantiene en su propio archivo. */
export class VistaComensal extends VistaBase {}

for (const ComponenteVista of [VistaAcceso, VistaMenu, VistaPedidos, VistaPagos]) {
  const metodos = Object.getOwnPropertyDescriptors(ComponenteVista.prototype);
  delete metodos.constructor;
  Object.defineProperties(VistaComensal.prototype, metodos);
}
