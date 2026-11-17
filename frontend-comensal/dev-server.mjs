import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { networkInterfaces } from "node:os";

const root = resolve("comensal");
const mobile = process.argv.includes("--mobile");
const port = Number(process.env.PORT) || (mobile ? 4174 : 4173);
const host = process.env.HOST || (mobile ? "0.0.0.0" : "127.0.0.1");
const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ mensaje: "API no configurada. Ejecuta el backend o usa ?demo=1 para probar la interfaz." }));
    return;
  }
  const path = url.pathname === "/" || /^\/mesa\/[^/]+\/?$/.test(url.pathname) ? "/index.html" : url.pathname;
  let file;
  try { file = resolve(root, `.${decodeURIComponent(path)}`); }
  catch { res.writeHead(400); res.end(); return; }
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  try {
    const body = await readFile(file);
    const image = /\.(?:jpe?g|png|webp)$/i.test(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": image ? "private, max-age=3600" : "no-store" });
    res.end(body);
  } catch { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Archivo no encontrado"); }
}).listen(port, host, () => {
  console.log(`DEVORA comensal: http://localhost:${port}/?mesa=01&demo=1`);
  if (mobile) {
    for (const [adapter, addresses] of Object.entries(networkInterfaces())) {
      for (const address of addresses || []) {
        if (address.family === "IPv4" && !address.internal) {
          console.log(`Celular (${adapter}): http://${address.address}:${port}/?mesa=01&demo=1`);
        }
      }
    }
  }
});
