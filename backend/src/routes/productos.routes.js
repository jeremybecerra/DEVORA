import { Router } from 'express';
import { crearProductoController } from '../controllers/producto.controller.js';

export function crearProductosRouter(services) {
  const router = Router();
  const productos = crearProductoController(services);
  router.get('/', productos.listar);
  return router;
}
