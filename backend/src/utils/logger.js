/** Registro simple con fecha. Se puede reemplazar por una librería (pino, winston) sin tocar el resto. */
const stamp = () => new Date().toISOString();

export const logger = {
  info: (...args) => console.log(`[${stamp()}]`, ...args),
  warn: (...args) => console.warn(`[${stamp()}] AVISO:`, ...args),
  error: (...args) => console.error(`[${stamp()}] ERROR:`, ...args),
};

export const silentLogger = { info() {}, warn() {}, error() {} };
