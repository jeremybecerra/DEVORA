/** Pedidos: creación desde el celular y consulta o cambio de estado desde el panel. */
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
  };
}
