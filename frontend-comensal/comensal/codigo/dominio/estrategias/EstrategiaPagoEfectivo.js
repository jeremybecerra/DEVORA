import { IEstrategiaPago } from "./IEstrategiaPago.js";
export class EstrategiaPagoEfectivo extends IEstrategiaPago {
  get metodo() { return "efectivo"; }
  get etiqueta() { return "Efectivo"; }
  get descripcion() { return "Solicitar que el mesero se acerque a cobrar."; }
  get textoBoton() { return "Solicitar cobro en efectivo"; }
}
