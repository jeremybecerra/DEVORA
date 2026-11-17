import { IEstrategiaPago } from "./IEstrategiaPago.js";
export class EstrategiaPagoQR extends IEstrategiaPago {
  get metodo() { return "qr"; }
  get etiqueta() { return "QR"; }
  get descripcion() { return "Mostrar QR del Restaurante"; }
  get textoBoton() { return "Generar QR para pagar"; }
}
