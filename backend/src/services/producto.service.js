import { ConflictError, NotFoundError } from '../domain/errors.js';

/** Consulta del menú y verificación de productos al armar un pedido. */
export class ProductoService {
  /** @param {{ productos: import('../repositories/contrato.js').ProductoRepository }} repos */
  constructor({ productos }) {
    this.productos = productos;
  }

  /** Menú ordenado por categoría y nombre. Con soloDisponibles se ocultan los agotados. */
  async listar({ categoria, soloDisponibles = false } = {}) {
    const productos = await this.productos.listar();
    return productos
      .filter((producto) => (!categoria || producto.categoria.toLowerCase() === categoria.toLowerCase()))
      .filter((producto) => (!soloDisponibles || producto.disponible))
      .sort((a, b) => a.categoria.localeCompare(b.categoria, 'es') || a.nombre.localeCompare(b.nombre, 'es'));
  }

  /**
   * Devuelve los productos pedidos, en un Map por id, comprobando que existan y estén disponibles.
   * Los precios salen de aquí (la base de datos), nunca de lo que envía el celular.
   */
  async obtenerDisponibles(ids) {
    const encontrados = await this.productos.buscarPorIds(ids);
    const porId = new Map(encontrados.map((producto) => [producto.id, producto]));

    const inexistente = ids.find((id) => !porId.has(id));
    if (inexistente !== undefined) throw new NotFoundError(`El producto ${inexistente} no existe en el menú.`);

    const agotado = ids.map((id) => porId.get(id)).find((producto) => !producto.disponible);
    if (agotado) throw new ConflictError(`«${agotado.nombre}» ya no está disponible. Quítalo de tu pedido o elige otro producto.`, 'PRODUCTO_NO_DISPONIBLE');

    return porId;
  }
}
