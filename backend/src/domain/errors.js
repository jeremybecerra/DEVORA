/**
 * Errores de la aplicación. Cada uno sabe su código HTTP, así los servicios no dependen de Express
 * y el middleware de errores solo traduce estos objetos a la respuesta JSON.
 */
export class AppError extends Error {
  constructor(message, { status = 500, code = 'ERROR_INTERNO', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }
}

/** 400: los datos enviados no cumplen las reglas (formato, campos obligatorios, rangos). */
export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { status: 400, code: 'DATOS_INVALIDOS', details });
  }
}

/** 404: el recurso solicitado no existe. */
export class NotFoundError extends AppError {
  constructor(message) {
    super(message, { status: 404, code: 'NO_ENCONTRADO' });
  }
}

/** 409: la solicitud es válida pero choca con el estado actual (mesa cerrada, producto agotado). */
export class ConflictError extends AppError {
  constructor(message, code = 'CONFLICTO') {
    super(message, { status: 409, code });
  }
}

/**
 * 409: otro proceso modificó el mismo registro entre la lectura y la escritura (control optimista).
 * Los servicios lo reintentan; solo llega al cliente si el conflicto persiste.
 */
export class ConcurrencyError extends AppError {
  constructor(message = 'El pedido cambió mientras se actualizaba. Inténtalo de nuevo.') {
    super(message, { status: 409, code: 'CONFLICTO_CONCURRENCIA' });
  }
}

/** 503: una dependencia externa (la base de datos) no responde. El servidor sigue vivo. */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'El servicio no está disponible en este momento. Inténtalo de nuevo en unos segundos.') {
    super(message, { status: 503, code: 'SERVICIO_NO_DISPONIBLE' });
  }
}

/** 501: la funcionalidad está prevista pero fuera del alcance del incremento actual. */
export class NotImplementedError extends AppError {
  constructor(message) {
    super(message, { status: 501, code: 'NO_DISPONIBLE' });
  }
}
