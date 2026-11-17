import { ConcurrencyError } from '../../domain/errors.js';
import { DATOS_INICIALES } from './datos-iniciales.js';

/**
 * Implementación en memoria del contrato de repositorios.
 * Sirve para desarrollar y para las pruebas automáticas: arranca sin instalar nada y se reinicia
 * con cada ejecución. Devuelve copias de los objetos para que nadie modifique los datos por fuera.
 */
export function crearRepositoriosMemoria(datos = DATOS_INICIALES) {
  const copia = (valor) => (valor === null || valor === undefined ? null : structuredClone(valor));
  const ahora = () => new Date().toISOString();

  const mesas = new Map(datos.mesas.map((mesa) => [mesa.id, { ...mesa }]));
  const productos = new Map(datos.productos.map((producto) => [producto.id, { ...producto }]));
  const comensales = new Map();
  const pedidos = new Map();
  const clavesIdempotencia = new Map();
  let siguienteComensal = 1;
  let siguientePedido = 1;

  const conNombreComensal = (pedido) => ({
    ...pedido,
    comensalNombre: comensales.get(pedido.comensalId)?.nombre ?? '',
  });

  const repositorioPedidos = {
    async crear({ mesaId, comensalId, estado, detalles, total, claveIdempotencia = null }) {
      const fecha = ahora();
      const pedido = { id: siguientePedido++, mesaId, comensalId, estado, fecha, actualizadoEn: fecha, version: 1, detalles: structuredClone(detalles), total };
      pedidos.set(pedido.id, pedido);
      if (claveIdempotencia) clavesIdempotencia.set(claveIdempotencia, pedido.id);
      return copia(conNombreComensal(pedido));
    },
    async buscarPorId(id) {
      const pedido = pedidos.get(Number(id));
      return pedido ? copia(conNombreComensal(pedido)) : null;
    },
    async buscarPorClaveIdempotencia(clave) {
      const id = clavesIdempotencia.get(clave);
      return id ? repositorioPedidos.buscarPorId(id) : null;
    },
    async listar({ mesaId, estado } = {}) {
      return [...pedidos.values()]
        .filter((pedido) => (!mesaId || pedido.mesaId === mesaId) && (!estado || pedido.estado === estado))
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
        .map((pedido) => copia(conNombreComensal(pedido)));
    },
    async actualizarDetalles(id, { detalles, total, estado }, versionEsperada) {
      const pedido = pedidos.get(Number(id));
      if (!pedido) return null;
      if (pedido.version !== versionEsperada) throw new ConcurrencyError();
      Object.assign(pedido, { detalles: structuredClone(detalles), total, estado, actualizadoEn: ahora(), version: pedido.version + 1 });
      return copia(conNombreComensal(pedido));
    },
    async actualizarEstado(id, estado, versionEsperada) {
      const pedido = pedidos.get(Number(id));
      if (!pedido) return null;
      if (pedido.version !== versionEsperada) throw new ConcurrencyError();
      Object.assign(pedido, { estado, actualizadoEn: ahora(), version: pedido.version + 1 });
      return copia(conNombreComensal(pedido));
    },
  };

  return {
    fuente: 'memory',
    async verificarSalud() {},
    mesas: {
      async listar() {
        return [...mesas.values()].sort((a, b) => a.id.localeCompare(b.id)).map(copia);
      },
      async buscarPorId(id) {
        return copia(mesas.get(String(id)));
      },
    },
    productos: {
      async listar() {
        return [...productos.values()].map(copia);
      },
      async buscarPorIds(ids) {
        return ids.map((id) => productos.get(Number(id))).filter(Boolean).map(copia);
      },
    },
    comensales: {
      async crear({ mesaId, nombre }) {
        const comensal = { id: siguienteComensal++, mesaId, nombre, creadoEn: ahora() };
        comensales.set(comensal.id, comensal);
        return copia(comensal);
      },
      async buscarPorId(id) {
        return copia(comensales.get(Number(id)));
      },
    },
    pedidos: repositorioPedidos,
    async cerrar() {},
  };
}
