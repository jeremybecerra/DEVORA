import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Supervisor mínimo para la demostración y producción: inicia el servidor y, si se cae por un
 * error grave, lo vuelve a levantar esperando un poco más cada vez (1 s, 2 s, 4 s… hasta 15 s).
 * Si falla 5 veces en menos de un minuto se detiene, para no ocultar un problema permanente.
 * En un servidor real cumple el mismo papel que pm2 o systemd.
 */
const SERVIDOR = fileURLToPath(new URL('../src/server.js', import.meta.url));
const MAX_REINICIOS = 5;
const VENTANA_MS = 60_000;

let hijo = null;
let deteniendo = false;
let reinicios = 0;
let ultimoReinicio = 0;

function log(mensaje) {
  console.log(`[${new Date().toISOString()}] [supervisor] ${mensaje}`);
}

function iniciar() {
  hijo = spawn(process.execPath, [SERVIDOR], { stdio: 'inherit', env: process.env });
  hijo.on('exit', (codigo, senal) => {
    if (deteniendo || codigo === 0) process.exit(codigo ?? 0);

    const ahora = Date.now();
    if (ahora - ultimoReinicio > VENTANA_MS) reinicios = 0;
    reinicios += 1;
    ultimoReinicio = ahora;
    if (reinicios > MAX_REINICIOS) {
      log(`El servidor falló ${MAX_REINICIOS} veces en menos de un minuto. Revisa el error anterior.`);
      process.exit(1);
    }
    const espera = Math.min(1000 * 2 ** (reinicios - 1), 15_000);
    log(`El servidor terminó (${senal ?? `código ${codigo}`}). Reiniciando en ${espera / 1000} s…`);
    setTimeout(iniciar, espera);
  });
}

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    deteniendo = true;
    if (hijo && hijo.exitCode === null) hijo.kill(senal);
    else process.exit(0);
  });
}

iniciar();
