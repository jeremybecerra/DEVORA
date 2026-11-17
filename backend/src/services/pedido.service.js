import { ConflictError, NotFoundError, NotImplementedError } from '../domain/errors.js';
import { lineSubtotal, sumAmounts } from '../domain/money.js';
import { ESTADOS_PEDIDO, ESTADOS_PEDIDO_EDITABLES, RULES, TRANSICIONES_PEDIDO } from '../domain/rules.js';
import {
  parseEstadoPedido, parseIdempotencyKey, parseItems, parseMesaId, parsePositiveId, requireBody,
} from '../domain/validators.js';

/** Reglas de negocio de los pedidos individuales: crear, consultar, ampliar y cambiar de estado. */
export class PedidoService {
  /**
   * @param {{ pedidos: import('../repositories/contrato.js').PedidoRepository }} repos
   * @param {{ mesaService: import('./mesa.service.js').MesaService,
   *           comensalService: import('./comensal.service.js').ComensalService,
   *           productoService: import('./producto.service.js').ProductoService }} servicios
   */
  constructor({ pedidos }, { mesaService, comensalService, productoService }) {
    this.pedidos = pedidos;
    this.mesaService = mesaService;
    this.comensalService = comensalService;
    this.productoService = productoService;
  }

  /**
   * Crea el pedido de un comensal (criterio CA-01: pedido válido se registra con su total).
   * Devuelve { pedido, creado }: creado=false cuando la misma clave de idempotencia ya registró
   * un pedido, así un doble toque no duplica nada (CA-07).
   * La clave se guarda junto al id del comensal: si otro comensal usa la misma clave,
   * no recibe un pedido ajeno, sino que se crea el suyo.
   */
  async crear(body, { claveIdempotencia: claveRecibida } = {}) {
    const datos = requireBody(body);
    const mesaId = parseMesaId(datos.mesaId);
    const comensalId = parsePositiveId(datos.comensalId, 'comensalId', 'el comensal');
    const items = parseItems(datos.items);
    const clave = parseIdempotencyKey(claveRecibida);
    const claveIdempotencia = clave ? `${comensalId}:${clave}` : null;

    if (claveIdempotencia) {
      const existente = await this.pedidos.buscarPorClaveIdempotencia(claveIdempotencia);
      if (existente) return { pedido: existente, creado: false };
    }

    await this.mesaService.obtenerAbierta(mesaId);
    await this.comensalService.obtenerDeMesa(comensalId, mesaId);
    const detalles = await this.#armarDetalles(items);

    const pedido = await this.pedidos.crear({
      mesaId,
      comensalId,
      estado: ESTADOS_PEDIDO.RECIBIDO,
      detalles,
      total: sumAmounts(detalles.map((detalle) => detalle.subtotal)),
      claveIdempotencia,
    });
    return { pedido, creado: true };
  }

  async obtener(id) {
    const pedidoId = parsePositiveId(id, 'id', 'el pedido');
    const pedido = await this.pedidos.buscarPorId(pedidoId);
    if (!pedido) throw new NotFoundError(`El pedido ${pedidoId} no existe.`);
    return pedido;
  }

  /** Lista para el panel del restaurante; opcionalmente filtrada por mesa y por estado. */
  async listar({ mesaId, estado } = {}) {
    const filtros = {};
    if (mesaId !== undefined && mesaId !== '') {
      filtros.mesaId = (await this.mesaService.obtener(mesaId)).id;
    }
    if (estado !== undefined && estado !== '') filtros.estado = parseEstadoPedido(estado);
    return this.pedidos.listar(filtros);
  }

  /** Agrega productos a un pedido existente; si un producto ya estaba, suma la cantidad. */
  async agregarItems(id, body) {
    const pedido = await this.obtener(id);
    const items = parseItems(requireBody(body).items);

    if (!ESTADOS_PEDIDO_EDITABLES.includes(pedido.estado)) {
      throw new ConflictError(`El pedido está «${pedido.estado}» y ya no admite productos nuevos. Haz un pedido nuevo.`, 'PEDIDO_CERRADO');
    }
    await this.mesaService.obtenerAbierta(pedido.mesaId);

    const cantidades = new Map(pedido.detalles.map((detalle) => [detalle.productoId, detalle.cantidad]));
    for (const { productoId, cantidad } of items) {
      const nueva = (cantidades.get(productoId) || 0) + cantidad;
      if (nueva > RULES.cantidadMaxPorProducto) {
        throw new ConflictError(`No se pueden pedir más de ${RULES.cantidadMaxPorProducto} unidades del mismo producto.`, 'CANTIDAD_MAXIMA');
      }
      cantidades.set(productoId, nueva);
    }

    // Se recalculan todas las líneas con el precio vigente de los productos que se agregan;
    // las líneas que no cambian conservan el precio con el que se pidieron.
    const nuevos = new Set(items.map((item) => item.productoId));
    const productos = await this.productoService.obtenerDisponibles([...nuevos]);
    const detalles = [...cantidades].map(([productoId, cantidad]) => {
      const anterior = pedido.detalles.find((detalle) => detalle.productoId === productoId);
      const producto = productos.get(productoId);
      const precio = producto ? producto.precio : anterior.precio;
      const nombre = producto ? producto.nombre : anterior.nombre;
      return { productoId, nombre, cantidad, precio, subtotal: lineSubtotal(precio, cantidad) };
    });

    return this.pedidos.actualizarDetalles(pedido.id, {
      detalles,
      total: sumAmounts(detalles.map((detalle) => detalle.subtotal)),
      estado: ESTADOS_PEDIDO.RECIBIDO,
    });
  }

  /** Cambio de estado desde el panel del restaurante, respetando las transiciones permitidas. */
  async cambiarEstado(id, body) {
    const pedido = await this.obtener(id);
    const estado = parseEstadoPedido(requireBody(body).estado);
    if (estado === pedido.estado) return pedido;
    if (!TRANSICIONES_PEDIDO[pedido.estado].includes(estado)) {
      throw new ConflictError(`No se puede pasar un pedido de «${pedido.estado}» a «${estado}».`, 'TRANSICION_INVALIDA');
    }
    return this.pedidos.actualizarEstado(pedido.id, estado);
  }

  /** El pago individual queda para el siguiente incremento (alcance acordado del primer parcial). */
  async solicitarPago(id) {
    await this.obtener(id);
    throw new NotImplementedError('El pago individual estará disponible en el siguiente incremento. Por ahora paga en caja.');
  }

  async #armarDetalles(items) {
    const productos = await this.productoService.obtenerDisponibles(items.map((item) => item.productoId));
    return items.map(({ productoId, cantidad }) => {
      const producto = productos.get(productoId);
      return {
        productoId,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal: lineSubtotal(producto.precio, cantidad),
      };
    });
  }
}
