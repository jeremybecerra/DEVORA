/** Registro y consulta de comensales. */
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
