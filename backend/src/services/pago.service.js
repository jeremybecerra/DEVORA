import { NotImplementedError } from '../domain/errors.js';

/**
 * Pagos individuales. Está fuera del alcance del primer incremento, pero ya tiene su propio módulo
 * (rutas, controlador y servicio): cuando se implemente, solo se completa este archivo y su
 * repositorio, sin tocar pedidos ni el resto de la API.
 */
export class PagoService {
  /** @param {{ pedidoService: import('./pedido.service.js').PedidoService }} servicios */
  constructor(repos, { pedidoService }) {
    this.pedidoService = pedidoService;
  }

  async solicitar(pedidoId) {
    await this.pedidoService.obtener(pedidoId);
    throw new NotImplementedError('El pago individual estará disponible en el siguiente incremento. Por ahora paga en caja.');
  }

  async obtener() {
    throw new NotImplementedError('La consulta de pagos estará disponible en el siguiente incremento.');
  }
}
