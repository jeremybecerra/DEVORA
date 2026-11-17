/** Contrato base de estrategias. No confirma pagos ni realiza cobros reales. */
export class IEstrategiaPago {
  get metodo() { throw new Error("Debe definirse el método de pago"); }
  get etiqueta() { throw new Error("Debe definirse la etiqueta de pago"); }
  get descripcion() { throw new Error("Debe definirse la descripción de pago"); }
  get textoBoton() { throw new Error("Debe definirse el botón de pago"); }
}
