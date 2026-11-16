import { createApp } from './app.js';
import { loadEnvFile, readConfig } from './config/env.js';
import { buildContainer } from './container.js';
import { logger } from './utils/logger.js';

async function main() {
  loadEnvFile();
  const config = readConfig();
  const container = await buildContainer(config);
  const app = createApp({ config, services: container.services, fuenteDatos: container.fuenteDatos, logger });

  const server = app.listen(config.port, () => {
    logger.info(`DEVORA API escuchando en http://localhost:${config.port}/api (datos: ${container.fuenteDatos})`);
    if (config.staticDirs.frontend) logger.info(`Frontend del comensal: http://localhost:${config.port}/?mesa=01`);
    if (config.staticDirs.panel) logger.info(`Panel del restaurante: http://localhost:${config.port}/panel/`);
  });

  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') logger.error(`El puerto ${config.port} ya está en uso. Cambia PORT en el archivo .env.`);
    else logger.error('No se pudo iniciar el servidor:', error);
    await container.cerrar().catch(() => {});
    process.exit(1);
  });

  // Apagado ordenado: deja de aceptar solicitudes y cierra las conexiones a la base de datos.
  let cerrando = false;
  const apagar = (senal) => {
    if (cerrando) return;
    cerrando = true;
    logger.info(`Recibido ${senal}. Cerrando el servidor…`);
    server.close(async () => {
      await container.cerrar().catch((error) => logger.error('Error al cerrar la base de datos:', error));
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

process.on('unhandledRejection', (reason) => logger.error('Promesa rechazada sin manejar:', reason));

main().catch((error) => {
  logger.error(error.message);
  process.exit(1);
});
