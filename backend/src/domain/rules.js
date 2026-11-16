/** Reglas de negocio del primer incremento, en un solo lugar para ajustarlas sin buscar en el código. */
export const RULES = Object.freeze({
  nombreMin: 2,
  nombreMax: 40,
  cantidadMaxPorProducto: 20,
  productosMaxPorPedido: 30,
  idMesaPatron: /^[A-Za-z0-9_-]{1,20}$/,
  claveIdempotenciaMax: 80,
});

export const ESTADOS_MESA = Object.freeze({ ABIERTA: 'abierta', CERRADA: 'cerrada' });

export const ESTADOS_PEDIDO = Object.freeze({
  RECIBIDO: 'recibido',
  EN_PREPARACION: 'en_preparacion',
  LISTO: 'listo',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
});

/** Transiciones permitidas del estado de un pedido (lo que el panel del restaurante puede hacer). */
export const TRANSICIONES_PEDIDO = Object.freeze({
  recibido: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo', 'cancelado'],
  listo: ['entregado'],
  entregado: [],
  cancelado: [],
});

/** Estados en los que el comensal todavía puede agregar productos a su pedido. */
export const ESTADOS_PEDIDO_EDITABLES = Object.freeze(['recibido', 'en_preparacion']);
