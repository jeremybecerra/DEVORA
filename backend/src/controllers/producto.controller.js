/** Menú del restaurante. */
export function crearProductoController({ productoService }) {
  return {
    async listar(req, res) {
      const soloDisponibles = String(req.query.disponibles ?? '').toLowerCase() === 'true';
      res.json(await productoService.listar({ categoria: req.query.categoria, soloDisponibles }));
    },
  };
}
