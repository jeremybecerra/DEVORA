import { Router } from 'express';
import { crearComensalController } from '../controllers/comensal.controller.js';

export function crearComensalesRouter(services) {
  const router = Router();
  const comensales = crearComensalController(services);
  router.post('/', comensales.registrar);
  router.get('/:id', comensales.obtener);
  return router;
}
