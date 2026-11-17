/**
 * Contrato de persistencia (patrón Repositorio).
 *
 * Los servicios solo conocen estos métodos; no saben si los datos están en memoria o en MySQL.
 * Para cambiar de base de datos basta con escribir otra implementación que cumpla este contrato
 * y registrarla en src/container.js. Todas las funciones son asíncronas.
 *
 * @typedef {{ id: string, nombre: string, estado: 'abierta'|'cerrada' }} Mesa
 *
 * @typedef {{ id: number, nombre: string, descripcion: string, categoria: string, precio: number,
 *   disponible: boolean, imagenUrl: string, tiempoEstimado: number|null }} Producto
 *
 * @typedef {{ id: number, mesaId: string, nombre: string, creadoEn: string }} Comensal
 *
 * @typedef {{ productoId: number, nombre: string, cantidad: number, precio: number, subtotal: number }} DetallePedido
 *
 * @typedef {{ id: number, mesaId: string, comensalId: number, comensalNombre: string,
 *   estado: string, fecha: string, actualizadoEn: string, version: number,
 *   detalles: DetallePedido[], total: number }} Pedido
 *
 * Control de concurrencia optimista: cada pedido tiene una "version" que sube en cada cambio.
 * actualizarDetalles y actualizarEstado reciben la versión que leyó el servicio; si en la base
 * ya hay otra, lanzan ConcurrencyError en lugar de pisar el cambio de otra solicitud.
 *
 * @typedef {Object} MesaRepository
 * @property {() => Promise<Mesa[]>} listar
 * @property {(id: string) => Promise<Mesa|null>} buscarPorId
 *
 * @typedef {Object} ProductoRepository
 * @property {() => Promise<Producto[]>} listar
 * @property {(ids: number[]) => Promise<Producto[]>} buscarPorIds
 *
 * @typedef {Object} ComensalRepository
 * @property {(datos: { mesaId: string, nombre: string }) => Promise<Comensal>} crear
 * @property {(id: number) => Promise<Comensal|null>} buscarPorId
 *
 * @typedef {Object} PedidoRepository
 * @property {(datos: { mesaId: string, comensalId: number, estado: string, detalles: DetallePedido[],
 *   total: number, claveIdempotencia: string|null }) => Promise<Pedido>} crear
 * @property {(id: number) => Promise<Pedido|null>} buscarPorId
 * @property {(clave: string) => Promise<Pedido|null>} buscarPorClaveIdempotencia
 * @property {(filtros: { mesaId?: string, estado?: string }) => Promise<Pedido[]>} listar
 * @property {(id: number, datos: { detalles: DetallePedido[], total: number, estado: string }, versionEsperada: number) => Promise<Pedido|null>} actualizarDetalles
 * @property {(id: number, estado: string, versionEsperada: number) => Promise<Pedido|null>} actualizarEstado
 *
 * @typedef {Object} Repositorios
 * @property {MesaRepository} mesas
 * @property {ProductoRepository} productos
 * @property {ComensalRepository} comensales
 * @property {PedidoRepository} pedidos
 * @property {() => Promise<void>} verificarSalud  Lanza un error si la fuente de datos no responde.
 * @property {() => Promise<void>} cerrar  Libera conexiones al apagar el servidor.
 */

export const METODOS_REQUERIDOS = Object.freeze({
  mesas: ['listar', 'buscarPorId'],
  productos: ['listar', 'buscarPorIds'],
  comensales: ['crear', 'buscarPorId'],
  pedidos: ['crear', 'buscarPorId', 'buscarPorClaveIdempotencia', 'listar', 'actualizarDetalles', 'actualizarEstado'],
});

/** Verifica al arrancar que una implementación cumple el contrato; evita errores a mitad de una solicitud. */
export function verificarContrato(repositorios) {
  const faltantes = [];
  for (const [nombre, metodos] of Object.entries(METODOS_REQUERIDOS)) {
    for (const metodo of metodos) {
      if (typeof repositorios?.[nombre]?.[metodo] !== 'function') faltantes.push(`${nombre}.${metodo}`);
    }
  }
  for (const metodo of ['verificarSalud', 'cerrar']) {
    if (typeof repositorios?.[metodo] !== 'function') faltantes.push(metodo);
  }
  if (faltantes.length) throw new Error(`El repositorio no cumple el contrato. Faltan: ${faltantes.join(', ')}`);
  return repositorios;
}
