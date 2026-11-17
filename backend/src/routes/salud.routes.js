import { Router } from 'express';

/**
 * Salud real del servicio: además de que el servidor responda, comprueba que la fuente de datos
 * conteste. Si la base de datos está caída responde 503 «degradado» (útil para monitoreo).
 */
export function crearSaludRouter({ fuenteDatos, verificarSalud, logger }) {
  const router = Router();
  router.get('/salud', async (req, res) => {
    const base = { fuenteDatos, hora: new Date().toISOString() };
    try {
      await verificarSalud();
      res.json({ estado: 'ok', baseDatos: 'ok', ...base });
    } catch (error) {
      logger.warn(`La fuente de datos no responde: ${error.message}`);
      res.status(503).json({ estado: 'degradado', baseDatos: 'sin_conexion', ...base });
    }
  });
  return router;
}
