/** Pagos individuales (módulo preparado para el siguiente incremento). */
export function crearPagoController({ pagoService }) {
  return {
    async solicitar(req, res) {
      res.status(201).json(await pagoService.solicitar(req.params.id, req.body));
    },
    async obtener(req, res) {
      res.json(await pagoService.obtener(req.params.id));
    },
  };
}
