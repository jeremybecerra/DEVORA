/** Mesas: consulta de mesas y de sus pedidos (filtro del panel). */
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
    async llamarMesero(req, res) {
      res.status(202).json(await mesaService.llamarMesero(req.params.id));
    },
  };
}
