/**
 * Controladores: traducen HTTP a llamadas de servicio y la respuesta a JSON.
 * No contienen reglas de negocio; esas viven en src/services.
 */

export function crearMesaController({ mesaService, pedidoService }) {
  return {
    async listar(req, res) {
      res.json(await mesaService.listar());
    },
    async obtener(req, res) {
      res.json(await mesaService.obtener(req.params.id));
    },
    async listarPedidos(req, res) {
      res.json(await pedidoService.listar({ mesaId: req.params.id, estado: req.query.estado }));
    },
  };
}

export function crearProductoController({ productoService }) {
  return {
    async listar(req, res) {
      const soloDisponibles = String(req.query.disponibles ?? '').toLowerCase() === 'true';
      res.json(await productoService.listar({ categoria: req.query.categoria, soloDisponibles }));
    },
  };
}

export function crearComensalController({ comensalService }) {
  return {
    async registrar(req, res) {
      const comensal = await comensalService.registrar(req.body);
      res.status(201).location(`/api/comensales/${comensal.id}`).json(comensal);
    },
    async obtener(req, res) {
      res.json(await comensalService.obtener(req.params.id));
    },
  };
}

export function crearPedidoController({ pedidoService }) {
  return {
    async crear(req, res) {
      const { pedido, creado } = await pedidoService.crear(req.body, { claveIdempotencia: req.get('Idempotency-Key') });
      res.status(creado ? 201 : 200).location(`/api/pedidos/${pedido.id}`).json(pedido);
    },
    async listar(req, res) {
      res.json(await pedidoService.listar({ mesaId: req.query.mesaId, estado: req.query.estado }));
    },
    async obtener(req, res) {
      res.json(await pedidoService.obtener(req.params.id));
    },
    async agregarItems(req, res) {
      res.json(await pedidoService.agregarItems(req.params.id, req.body));
    },
    async cambiarEstado(req, res) {
      res.json(await pedidoService.cambiarEstado(req.params.id, req.body));
    },
    async solicitarPago(req, res) {
      await pedidoService.solicitarPago(req.params.id);
    },
  };
}
