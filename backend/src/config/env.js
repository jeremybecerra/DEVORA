import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const DATA_SOURCES = ['memory', 'mysql'];
const ENVIRONMENTS = ['development', 'production', 'test'];

/** Carga backend/.env si existe. Las variables ya definidas en el sistema tienen prioridad. */
export function loadEnvFile(file = path.join(BACKEND_ROOT, '.env')) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

function toInt(value, fallback, name, errors) {
  if (value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    errors.push(`${name} debe ser un número entero positivo (valor recibido: "${value}").`);
    return fallback;
  }
  return number;
}

function toBool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes', 'si', 'sí'].includes(String(value).toLowerCase());
}

function resolveDir(value) {
  if (!value) return null;
  const dir = path.resolve(BACKEND_ROOT, value);
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory() ? dir : null;
}

/**
 * Lee y valida la configuración. Si algo está mal, falla al arrancar con un mensaje claro
 * en lugar de fallar más tarde con un error confuso.
 */
export function readConfig(env = process.env) {
  const errors = [];

  const nodeEnv = env.NODE_ENV || 'development';
  if (!ENVIRONMENTS.includes(nodeEnv)) errors.push(`NODE_ENV debe ser uno de: ${ENVIRONMENTS.join(', ')}.`);

  const dataSource = (env.DATA_SOURCE || 'memory').toLowerCase();
  if (!DATA_SOURCES.includes(dataSource)) errors.push(`DATA_SOURCE debe ser uno de: ${DATA_SOURCES.join(', ')}.`);

  const corsOrigins = (env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const db = {
    host: env.DB_HOST || 'localhost',
    port: toInt(env.DB_PORT, 3306, 'DB_PORT', errors),
    user: env.DB_USER || '',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || '',
    connectionLimit: toInt(env.DB_CONNECTION_LIMIT, 10, 'DB_CONNECTION_LIMIT', errors),
  };
  if (dataSource === 'mysql') {
    if (!db.user) errors.push('DB_USER es obligatorio cuando DATA_SOURCE=mysql.');
    if (!db.database) errors.push('DB_NAME es obligatorio cuando DATA_SOURCE=mysql.');
  }

  if (errors.length) {
    const error = new Error(`Configuración inválida:\n- ${errors.join('\n- ')}`);
    error.code = 'CONFIG_INVALIDA';
    throw error;
  }

  return Object.freeze({
    env: nodeEnv,
    port: toInt(env.PORT, 3000, 'PORT', []),
    dataSource,
    corsOrigins,
    logRequests: toBool(env.LOG_REQUESTS, nodeEnv !== 'test'),
    db: Object.freeze(db),
    staticDirs: Object.freeze({
      frontend: resolveDir(env.FRONTEND_DIR),
      panel: resolveDir(env.PANEL_DIR),
    }),
  });
}
