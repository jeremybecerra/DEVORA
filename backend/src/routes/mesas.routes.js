import { Router } from 'express';
import { crearMesaController } from '../controllers/mesa.controller.js';

export function crearMesasRouter(services) {
  const router = Router();
  const mesas = crearMesaController(services);
  router.get('/', mesas.listar);
  router.get('/:id', mesas.obtener);
  router.get('/:id/pedidos', mesas.listarPedidos);
  router.post('/:id/llamadas', mesas.llamarMesero);
  return router;
}
