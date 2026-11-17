import { createApp } from './app.js';
import { loadEnvFile, readConfig } from './config/env.js';
import { buildContainer } from './container.js';
import { logger } from './utils/logger.js';

/** Función de apagado ordenado; se asigna cuando el servidor ya está escuchando. */
let apagar = null;

async function main() {
  loadEnvFile();
  const config = readConfig();
  const container = await buildContainer(config);
  const app = createApp({
    config,
    services: container.services,
    fuenteDatos: container.fuenteDatos,
    verificarSalud: container.verificarSalud,
    logger,
  });

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

  // Apagado ordenado: deja de aceptar solicitudes, termina las que están en curso
  // y cierra las conexiones a la base de datos antes de salir.
  let cerrando = false;
  apagar = (motivo, codigoSalida = 0) => {
    if (cerrando) return;
    cerrando = true;
    logger.info(`${motivo}: cerrando el servidor…`);
    server.close(async () => {
      await container.cerrar().catch((error) => logger.error('Error al cerrar la base de datos:', error));
      process.exit(codigoSalida);
    });
    setTimeout(() => process.exit(codigoSalida || 1), 10_000).unref();
  };
  process.on('SIGINT', () => apagar('Recibido SIGINT'));
  process.on('SIGTERM', () => apagar('Recibido SIGTERM'));
}

// Un error de una solicitud nunca llega aquí: lo atiende el manejador de errores de Express.
// Estos dos casos son fallas fuera de cualquier solicitud.
process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada sin manejar:', reason);
});
process.on('uncaughtException', (error) => {
  // Después de un error no controlado el estado del proceso no es confiable:
  // se registra, se cierra en orden y un administrador de procesos (npm run start:prod) lo reinicia.
  logger.error('Error no controlado; el servidor se cerrará de forma ordenada:', error);
  if (apagar) apagar('Error no controlado', 1);
  else process.exit(1);
});

main().catch((error) => {
  logger.error(error.message);
  process.exit(1);
});
