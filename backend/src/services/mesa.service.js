import { ConflictError, NotFoundError, NotImplementedError } from '../domain/errors.js';
import { ESTADOS_MESA } from '../domain/rules.js';
import { parseMesaId } from '../domain/validators.js';

/** Reglas sobre las mesas: existir y estar abiertas para recibir comensales y pedidos. */
export class MesaService {
  /** @param {{ mesas: import('../repositories/contrato.js').MesaRepository }} repos */
  constructor({ mesas }) {
    this.mesas = mesas;
  }

  async listar() {
    return this.mesas.listar();
  }

  async obtener(id) {
    const mesaId = parseMesaId(id, 'id');
    const mesa = await this.mesas.buscarPorId(mesaId);
    if (!mesa) throw new NotFoundError(`La mesa ${mesaId} no existe.`);
    return mesa;
  }

  /** Devuelve la mesa solo si puede recibir comensales y pedidos; si no, explica por qué. */
  async obtenerAbierta(id) {
    const mesa = await this.obtener(id);
    if (mesa.estado !== ESTADOS_MESA.ABIERTA) {
      throw new ConflictError(`La ${mesa.nombre} está cerrada y no recibe pedidos. Pide ayuda al personal.`, 'MESA_CERRADA');
    }
    return mesa;
  }

  /** Llamar al mesero desde la app: previsto para el siguiente incremento. */
  async llamarMesero(id) {
    await this.obtener(id);
    throw new NotImplementedError('Llamar al mesero desde la app estará disponible en el siguiente incremento.');
  }
}
