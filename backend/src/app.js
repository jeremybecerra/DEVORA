import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { apiNotFound, errorHandler, requestLogger, securityHeaders } from './middlewares/index.js';
import { crearApiRouter } from './routes/api.routes.js';

/**
 * Crea la aplicación Express sin abrir ningún puerto. Así las pruebas pueden levantarla
 * con datos en memoria y el servidor real con MySQL, usando exactamente el mismo código.
 */
export function createApp({ config, services, fuenteDatos, logger }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeaders);
  if (config.logRequests) app.use(requestLogger(logger));

  const todosLosOrigenes = config.corsOrigins.includes('*');
  app.use('/api', cors({
    origin: todosLosOrigenes ? true : config.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Idempotency-Key'],
    exposedHeaders: ['Location'],
  }));
  app.use('/api', express.json({ limit: '100kb' }));

  app.use('/api', crearApiRouter(services, { fuenteDatos }));
  app.use('/api', apiNotFound);

  // Opcional: servir el panel del restaurante y el frontend del comensal desde el mismo servidor.
  const { frontend, panel } = config.staticDirs;
  if (panel) app.use('/panel', express.static(panel));
  if (frontend) {
    app.use(express.static(frontend));
    // El QR puede abrir /mesa/01; se responde con la página del frontend para que lea la mesa.
    app.use((req, res, next) => {
      if (req.method === 'GET' && /^\/mesa\/[^/]+\/?$/.test(req.path)) return res.sendFile(path.join(frontend, 'index.html'));
      return next();
    });
  } else {
    app.get('/', (req, res) => {
      res.json({ nombre: 'API DEVORA', api: '/api', salud: '/api/salud', panel: panel ? '/panel/' : null });
    });
  }

  app.use((req, res) => {
    res.status(404).json({ codigo: 'RUTA_NO_ENCONTRADA', mensaje: `La ruta ${req.method} ${req.originalUrl} no existe.` });
  });
  app.use(errorHandler(logger));
  return app;
}
