import { Router } from 'express';
import { crearPedidoController } from '../controllers/pedido.controller.js';

export function crearPedidosRouter(services) {
  const router = Router();
  const pedidos = crearPedidoController(services);
  router.get('/', pedidos.listar);
  router.post('/', pedidos.crear);
  router.get('/:id', pedidos.obtener);
  router.post('/:id/items', pedidos.agregarItems);
  router.patch('/:id/estado', pedidos.cambiarEstado);
  return router;
}
