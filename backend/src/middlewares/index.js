import { AppError } from '../domain/errors.js';

/** Encabezados básicos de seguridad para todas las respuestas. */
export function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  });
  next();
}

/** Registra método, ruta, código y duración de cada solicitud. */
export function requestLogger(logger) {
  return (req, res, next) => {
    const inicio = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
      logger.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms.toFixed(1)} ms)`);
    });
    next();
  };
}

/** Rutas de la API que no existen: responden JSON en lugar de una página HTML. */
export function apiNotFound(req, res) {
  res.status(404).json({ codigo: 'RUTA_NO_ENCONTRADA', mensaje: `La ruta ${req.method} ${req.originalUrl} no existe.` });
}

/**
 * Manejador central de errores. Todos los errores terminan aquí y salen con el mismo formato:
 * { codigo, mensaje, detalles? }. El frontend muestra "mensaje" directamente al usuario.
 */
export function errorHandler(logger) {
  // Express reconoce el manejador de errores porque recibe cuatro parámetros.
  return (error, req, res, next) => { // eslint-disable-line no-unused-vars
    if (error?.type === 'entity.parse.failed') {
      return res.status(400).json({ codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo de la solicitud no es un JSON válido.' });
    }
    if (error?.type === 'entity.too.large') {
      return res.status(413).json({ codigo: 'CUERPO_DEMASIADO_GRANDE', mensaje: 'La solicitud es demasiado grande.' });
    }
    if (error instanceof AppError) {
      const cuerpo = { codigo: error.code, mensaje: error.message };
      if (error.details) cuerpo.detalles = error.details;
      return res.status(error.status).json(cuerpo);
    }
    logger.error(`Error no controlado en ${req.method} ${req.originalUrl}:`, error);
    return res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'El servidor no pudo completar la solicitud. Inténtalo de nuevo.' });
  };
}
