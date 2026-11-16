import { ConflictError, NotFoundError } from '../domain/errors.js';
import { parseMesaId, parseNombre, parsePositiveId, requireBody } from '../domain/validators.js';

/** Registro e identificación de comensales dentro de una mesa. */
export class ComensalService {
  /**
   * @param {{ comensales: import('../repositories/contrato.js').ComensalRepository }} repos
   * @param {{ mesaService: import('./mesa.service.js').MesaService }} servicios
   */
  constructor({ comensales }, { mesaService }) {
    this.comensales = comensales;
    this.mesaService = mesaService;
  }

  /** Registra al comensal en una mesa abierta. Solo se guarda su nombre (privacidad, RNF-04). */
  async registrar(body) {
    const datos = requireBody(body);
    const mesaId = parseMesaId(datos.mesaId);
    const nombre = parseNombre(datos.nombre);
    await this.mesaService.obtenerAbierta(mesaId);
    return this.comensales.crear({ mesaId, nombre });
  }

  async obtener(id) {
    const comensalId = parsePositiveId(id, 'id', 'el comensal');
    const comensal = await this.comensales.buscarPorId(comensalId);
    if (!comensal) throw new NotFoundError(`El comensal ${comensalId} no existe.`);
    return comensal;
  }

  /** Comprueba que el comensal exista y pertenezca a la mesa indicada. */
  async obtenerDeMesa(comensalId, mesaId) {
    const comensal = await this.obtener(comensalId);
    if (comensal.mesaId !== mesaId) {
      throw new ConflictError('El comensal no pertenece a esta mesa. Vuelve a escanear el QR de tu mesa.', 'COMENSAL_OTRA_MESA');
    }
    return comensal;
  }
}
