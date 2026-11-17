import { Router } from 'express';
import { crearPagoController } from '../controllers/pago.controller.js';

export function crearPagosRouter(services) {
  const router = Router();
  const pagos = crearPagoController(services);
  router.post('/pedidos/:id/pagos', pagos.solicitar);
  router.get('/pagos/:id', pagos.obtener);
  return router;
}
