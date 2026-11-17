import { ServiceUnavailableError } from '../../domain/errors.js';

/** Códigos de error que indican que la base de datos no está disponible (no que la consulta esté mal). */
const CODIGOS_DE_CONEXION = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'EPIPE',
  'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_SEQUENCE_TIMEOUT', 'ER_CON_COUNT_ERROR', 'POOL_CLOSED',
]);

export function esErrorDeConexion(error) {
  return Boolean(error && (CODIGOS_DE_CONEXION.has(error.code) || error.fatal === true));
}

/**
 * Envuelve cada método de los repositorios: si la base de datos no responde, el error técnico
 * del driver se convierte en ServiceUnavailableError (503) con un mensaje entendible.
 * Así una caída de MySQL afecta solo a las solicitudes que la necesitan y nunca apaga el servidor.
 */
export function protegerConexion(repositorios) {
  const envolver = (funcion, contexto) => async (...args) => {
    try {
      return await funcion.apply(contexto, args);
    } catch (error) {
      if (esErrorDeConexion(error)) throw new ServiceUnavailableError();
      throw error;
    }
  };

  const protegido = {};
  for (const [nombre, valor] of Object.entries(repositorios)) {
    if (typeof valor === 'function') {
      protegido[nombre] = nombre === 'cerrar' ? valor : envolver(valor, repositorios);
    } else if (valor && typeof valor === 'object') {
      protegido[nombre] = Object.fromEntries(
        Object.entries(valor).map(([metodo, funcion]) => [metodo, typeof funcion === 'function' ? envolver(funcion, valor) : funcion]),
      );
    } else {
      protegido[nombre] = valor;
    }
  }
  return protegido;
}
