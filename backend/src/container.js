import { verificarContrato } from './repositories/contrato.js';
import { crearRepositoriosMemoria } from './repositories/memory/index.js';
import { ComensalService } from './services/comensal.service.js';
import { MesaService } from './services/mesa.service.js';
import { PagoService } from './services/pago.service.js';
import { PedidoService } from './services/pedido.service.js';
import { ProductoService } from './services/producto.service.js';

/**
 * Raíz de composición (inyección de dependencias): el único lugar que decide qué implementación
 * de repositorio se usa y cómo se conectan los servicios entre sí.
 */
export async function buildContainer(config, { repositorios } = {}) {
  const repos = verificarContrato(repositorios ?? (await crearRepositorios(config)));

  const mesaService = new MesaService(repos);
  const productoService = new ProductoService(repos);
  const comensalService = new ComensalService(repos, { mesaService });
  const pedidoService = new PedidoService(repos, { mesaService, comensalService, productoService });
  const pagoService = new PagoService(repos, { pedidoService });

  return {
    fuenteDatos: repos.fuente ?? config.dataSource,
    services: Object.freeze({ mesaService, productoService, comensalService, pedidoService, pagoService }),
    verificarSalud: () => repos.verificarSalud(),
    cerrar: () => repos.cerrar(),
  };
}

async function crearRepositorios(config) {
  if (config.dataSource === 'mysql') {
    // Import dinámico: el driver de MySQL solo se carga si realmente se usa.
    const { crearRepositoriosMysql } = await import('./repositories/mysql/index.js');
    return crearRepositoriosMysql(config.db);
  }
  return crearRepositoriosMemoria();
}
