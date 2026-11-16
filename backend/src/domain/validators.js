import { ValidationError } from './errors.js';
import { RULES, ESTADOS_PEDIDO } from './rules.js';

/**
 * Validadores de entrada. Cada uno devuelve el valor ya normalizado o lanza ValidationError
 * con la lista de campos que fallaron, para que el frontend pueda mostrar un mensaje claro.
 */

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

function fail(campo, mensaje) {
  throw new ValidationError(mensaje, [{ campo, mensaje }]);
}

/** Identificador de mesa: código corto como "01" o "terraza-2" (viene del QR). */
export function parseMesaId(value, campo = 'mesaId') {
  if (value === undefined || value === null || value === '') fail(campo, 'El identificador de la mesa es obligatorio.');
  const id = String(value).trim();
  if (!RULES.idMesaPatron.test(id)) fail(campo, 'El identificador de la mesa no tiene un formato válido.');
  return id;
}

/** Identificador numérico (comensal, producto, pedido): entero positivo, también si llega como texto. */
export function parsePositiveId(value, campo, etiqueta) {
  const text = typeof value === 'string' ? value.trim() : value;
  const number = Number(text);
  if (text === '' || text === null || text === undefined || !Number.isSafeInteger(number) || number <= 0) {
    fail(campo, `El identificador de ${etiqueta} debe ser un número entero positivo.`);
  }
  return number;
}

/** Nombre o apodo del comensal: sin espacios extra, entre 2 y 40 caracteres, sin caracteres de control. */
export function parseNombre(value, campo = 'nombre') {
  if (typeof value !== 'string') fail(campo, 'Escribe un nombre o apodo.');
  const nombre = value.trim().replace(/\s+/g, ' ');
  if (nombre.length < RULES.nombreMin) fail(campo, `El nombre o apodo debe tener al menos ${RULES.nombreMin} caracteres.`);
  if (nombre.length > RULES.nombreMax) fail(campo, `El nombre o apodo no puede superar ${RULES.nombreMax} caracteres.`);
  if (CONTROL_CHARS.test(nombre)) fail(campo, 'El nombre contiene caracteres no permitidos.');
  return nombre;
}

/**
 * Lista de productos de un pedido: [{ productoId, cantidad }].
 * - No puede estar vacía (criterio CA-02: no se guardan pedidos vacíos).
 * - Cada cantidad es un entero entre 1 y el máximo permitido.
 * - Si un producto aparece dos veces, se suman sus cantidades.
 */
export function parseItems(value, campo = 'items') {
  if (!Array.isArray(value) || value.length === 0) {
    fail(campo, 'Agrega al menos un producto antes de confirmar.');
  }
  if (value.length > RULES.productosMaxPorPedido) {
    fail(campo, `Un pedido no puede tener más de ${RULES.productosMaxPorPedido} productos distintos.`);
  }

  const errores = [];
  const porProducto = new Map();

  value.forEach((item, index) => {
    const prefijo = `${campo}[${index}]`;
    if (!item || typeof item !== 'object') {
      errores.push({ campo: prefijo, mensaje: 'Cada producto debe indicar productoId y cantidad.' });
      return;
    }
    const productoId = Number(item.productoId);
    if (!Number.isSafeInteger(productoId) || productoId <= 0) {
      errores.push({ campo: `${prefijo}.productoId`, mensaje: 'El identificador del producto no es válido.' });
      return;
    }
    const cantidad = Number(item.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > RULES.cantidadMaxPorProducto) {
      errores.push({ campo: `${prefijo}.cantidad`, mensaje: `La cantidad debe ser un número entero entre 1 y ${RULES.cantidadMaxPorProducto}.` });
      return;
    }
    porProducto.set(productoId, (porProducto.get(productoId) || 0) + cantidad);
  });

  if (errores.length) throw new ValidationError(errores[0].mensaje, errores);

  const items = [...porProducto].map(([productoId, cantidad]) => ({ productoId, cantidad }));
  const excedido = items.find((item) => item.cantidad > RULES.cantidadMaxPorProducto);
  if (excedido) fail(campo, `No se pueden pedir más de ${RULES.cantidadMaxPorProducto} unidades del mismo producto.`);
  return items;
}

/** Clave opcional para que un mismo envío repetido no cree dos pedidos (criterio CA-07). */
export function parseIdempotencyKey(value) {
  if (value === undefined || value === null || value === '') return null;
  const key = String(value).trim();
  if (!key || key.length > RULES.claveIdempotenciaMax || CONTROL_CHARS.test(key)) {
    fail('Idempotency-Key', 'La clave de idempotencia no es válida.');
  }
  return key;
}

export function parseEstadoPedido(value, campo = 'estado') {
  const estados = Object.values(ESTADOS_PEDIDO);
  if (typeof value !== 'string' || !estados.includes(value)) {
    fail(campo, `El estado debe ser uno de: ${estados.join(', ')}.`);
  }
  return value;
}

/** Exige que el cuerpo de la solicitud sea un objeto JSON. */
export function requireBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('El cuerpo de la solicitud debe ser un objeto JSON.', [{ campo: 'body', mensaje: 'Se esperaba un objeto JSON.' }]);
  }
  return body;
}
