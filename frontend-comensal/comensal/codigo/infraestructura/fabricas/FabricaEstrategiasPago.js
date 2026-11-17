import { EstrategiaPagoEfectivo } from "../../dominio/estrategias/EstrategiaPagoEfectivo.js";
import { EstrategiaPagoQR } from "../../dominio/estrategias/EstrategiaPagoQR.js";
export class FabricaEstrategiasPago {
  static crear(metodo) {
    const estrategias = { efectivo: EstrategiaPagoEfectivo, qr: EstrategiaPagoQR };
    const Clase = estrategias[metodo];
    if (!Clase) throw new Error(`Método de pago no permitido: ${metodo}`);
    return new Clase();
  }
  static disponibles() { return [new EstrategiaPagoEfectivo(), new EstrategiaPagoQR()]; }
}
