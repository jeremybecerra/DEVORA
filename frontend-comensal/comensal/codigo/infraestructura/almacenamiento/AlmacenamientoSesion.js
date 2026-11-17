/** Encapsula sessionStorage sin hacer obligatoria su disponibilidad. */
export class AlmacenamientoSesion {
  constructor(clave, almacenamiento = globalThis.sessionStorage) { this.clave = clave; this.almacenamiento = almacenamiento; }
  cargar() { try { return JSON.parse(this.almacenamiento?.getItem(this.clave) || "{}") || {}; } catch { return {}; } }
  guardar(valor) { try { this.almacenamiento?.setItem(this.clave, JSON.stringify(valor)); } catch { /* opcional */ } }
  borrar() { try { this.almacenamiento?.removeItem(this.clave); } catch { /* opcional */ } }
}
