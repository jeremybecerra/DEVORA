import { createApp } from '../src/app.js';
import { readConfig } from '../src/config/env.js';
import { buildContainer } from '../src/container.js';
import { crearRepositoriosMemoria } from '../src/repositories/memory/index.js';
import { silentLogger } from '../src/utils/logger.js';

/**
 * Levanta la API en un puerto libre con datos en memoria nuevos para cada prueba.
 * Devuelve una función api(método, ruta, cuerpo) que responde { status, body, headers }.
 */
export async function levantarApi({ repositorios = crearRepositoriosMemoria() } = {}) {
  const config = readConfig({ NODE_ENV: 'test', DATA_SOURCE: 'memory', LOG_REQUESTS: 'false' });
  const container = await buildContainer(config, { repositorios });
  const app = createApp({
    config,
    services: container.services,
    fuenteDatos: container.fuenteDatos,
    verificarSalud: container.verificarSalud,
    logger: silentLogger,
  });

  const server = await new Promise((resolve) => {
    const instancia = app.listen(0, () => resolve(instancia));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function api(metodo, ruta, cuerpo, encabezados = {}) {
    const respuesta = await fetch(base + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...encabezados },
      body: cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
    });
    const texto = await respuesta.text();
    let body = texto;
    try { body = texto ? JSON.parse(texto) : null; } catch { /* respuesta no JSON */ }
    return { status: respuesta.status, body, headers: respuesta.headers };
  }

  async function cerrar() {
    await new Promise((resolve) => server.close(resolve));
    await container.cerrar();
  }

  return { api, cerrar, base };
}

/** Registra un comensal en una mesa y devuelve su id (atajo para las pruebas de pedidos). */
export async function registrarComensal(api, mesaId = '01', nombre = 'Pame') {
  const { status, body } = await api('POST', '/api/comensales', { mesaId, nombre });
  if (status !== 201) throw new Error(`No se pudo registrar el comensal: ${status} ${JSON.stringify(body)}`);
  return body.id;
}
