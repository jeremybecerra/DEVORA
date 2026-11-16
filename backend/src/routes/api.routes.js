import { Router } from 'express';
import { NotImplementedError } from '../domain/errors.js';
import {
  crearComensalController, crearMesaController, crearPedidoController, crearProductoController,
} from '../controllers/index.js';

/** Tabla de rutas de la API. Express 5 captura los errores de las funciones async automáticamente. */
export function crearApiRouter(services, { fuenteDatos }) {
  const router = Router();
  const mesas = crearMesaController(services);
  const productos = crearProductoController(services);
  const comensales = crearComensalController(services);
  const pedidos = crearPedidoController(services);
  const noDisponible = (mensaje) => () => { throw new NotImplementedError(mensaje); };

  router.get('/', (req, res) => {
    res.json({
      nombre: 'API DEVORA',
      version: '1.0.0',
      rutas: [
        'GET /api/salud',
        'GET /api/mesas', 'GET /api/mesas/:id', 'GET /api/mesas/:id/pedidos',
        'GET /api/productos',
        'POST /api/comensales', 'GET /api/comensales/:id',
        'GET /api/pedidos', 'POST /api/pedidos', 'GET /api/pedidos/:id',
        'POST /api/pedidos/:id/items', 'PATCH /api/pedidos/:id/estado',
      ],
    });
  });

  router.get('/salud', (req, res) => {
    res.json({ estado: 'ok', fuenteDatos, hora: new Date().toISOString() });
  });

  router.get('/mesas', mesas.listar);
  router.get('/mesas/:id', mesas.obtener);
  router.get('/mesas/:id/pedidos', mesas.listarPedidos);
  router.post('/mesas/:id/llamadas', noDisponible('Llamar al mesero desde la app estará disponible en el siguiente incremento.'));

  router.get('/productos', productos.listar);

  router.post('/comensales', comensales.registrar);
  router.get('/comensales/:id', comensales.obtener);

  router.get('/pedidos', pedidos.listar);
  router.post('/pedidos', pedidos.crear);
  router.get('/pedidos/:id', pedidos.obtener);
  router.post('/pedidos/:id/items', pedidos.agregarItems);
  router.patch('/pedidos/:id/estado', pedidos.cambiarEstado);
  router.post('/pedidos/:id/pagos', pedidos.solicitarPago);
  router.get('/pagos/:id', noDisponible('La consulta de pagos estará disponible en el siguiente incremento.'));

  return router;
}
