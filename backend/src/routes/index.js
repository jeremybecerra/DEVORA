import { Router } from 'express';
import { crearComensalesRouter } from './comensales.routes.js';
import { crearMesasRouter } from './mesas.routes.js';
import { crearPagosRouter } from './pagos.routes.js';
import { crearPedidosRouter } from './pedidos.routes.js';
import { crearProductosRouter } from './productos.routes.js';
import { crearSaludRouter } from './salud.routes.js';

/** Rutas públicas de la API (se muestran en GET /api). */
const RUTAS = [
  'GET /api/salud',
  'GET /api/mesas', 'GET /api/mesas/:id', 'GET /api/mesas/:id/pedidos',
  'GET /api/productos',
  'POST /api/comensales', 'GET /api/comensales/:id',
  'GET /api/pedidos', 'POST /api/pedidos', 'GET /api/pedidos/:id',
  'POST /api/pedidos/:id/items', 'PATCH /api/pedidos/:id/estado',
];

/**
 * Une los módulos de la API. Cada recurso tiene su archivo de rutas y su controlador:
 * agregar un módulo nuevo es crear sus archivos y montarlo aquí con una línea.
 * Express 5 envía a errorHandler cualquier error de una función async.
 */
export function crearApiRouter(services, { fuenteDatos, verificarSalud, logger }) {
  const router = Router();
  router.get('/', (req, res) => res.json({ nombre: 'API DEVORA', version: '1.0.0', rutas: RUTAS }));
  router.use(crearSaludRouter({ fuenteDatos, verificarSalud, logger }));
  router.use('/mesas', crearMesasRouter(services));
  router.use('/productos', crearProductosRouter(services));
  router.use('/comensales', crearComensalesRouter(services));
  router.use(crearPagosRouter(services));
  router.use('/pedidos', crearPedidosRouter(services));
  return router;
}
