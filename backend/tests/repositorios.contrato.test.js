import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadEnvFile, readConfig } from '../src/config/env.js';
import { ConcurrencyError } from '../src/domain/errors.js';
import { verificarContrato } from '../src/repositories/contrato.js';
import { crearRepositoriosMemoria } from '../src/repositories/memory/index.js';

/**
 * Pruebas de contrato: cualquier implementación de repositorios debe pasar las mismas pruebas.
 * La de memoria se prueba siempre. La de MySQL solo cuando el .env tiene DATA_SOURCE=mysql
 * (por ejemplo con `npm run test:mysql` después de cargar docs/esquema-mysql.sql).
 */
function probarContrato(nombre, crear) {
  describe(`Contrato de repositorios: ${nombre}`, () => {
    it('cumple todos los métodos del contrato', async () => {
      const repos = await crear();
      try { verificarContrato(repos); } finally { await repos.cerrar(); }
    });

    it('guarda y recupera un pedido con sus detalles', async () => {
      const repos = await crear();
      try {
        const mesa = (await repos.mesas.listar()).find((m) => m.estado === 'abierta');
        const [producto] = (await repos.productos.listar()).filter((p) => p.disponible);
        const comensal = await repos.comensales.crear({ mesaId: mesa.id, nombre: 'Prueba contrato' });
        const pedido = await repos.pedidos.crear({
          mesaId: mesa.id,
          comensalId: comensal.id,
          estado: 'recibido',
          detalles: [{ productoId: producto.id, nombre: producto.nombre, cantidad: 2, precio: producto.precio, subtotal: producto.precio * 2 }],
          total: producto.precio * 2,
          claveIdempotencia: `contrato-${Date.now()}-${Math.random()}`,
        });
        const leido = await repos.pedidos.buscarPorId(pedido.id);
        assert.equal(leido.comensalNombre, 'Prueba contrato');
        assert.equal(leido.detalles.length, 1);
        assert.equal(leido.total, producto.precio * 2);
        assert.equal(typeof leido.fecha, 'string');

        assert.equal(leido.version, 1);
        const actualizado = await repos.pedidos.actualizarEstado(pedido.id, 'en_preparacion', 1);
        assert.equal(actualizado.estado, 'en_preparacion');
        assert.equal(actualizado.version, 2);

        // Control optimista: con una versión vieja no se pisa el cambio de otra solicitud.
        await assert.rejects(
          repos.pedidos.actualizarEstado(pedido.id, 'cancelado', 1),
          (error) => error instanceof ConcurrencyError,
        );
        await assert.rejects(
          repos.pedidos.actualizarDetalles(pedido.id, { detalles: leido.detalles, total: leido.total, estado: 'recibido' }, 1),
          (error) => error instanceof ConcurrencyError,
        );
        assert.equal((await repos.pedidos.buscarPorId(pedido.id)).estado, 'en_preparacion');
        assert.ok((await repos.pedidos.listar({ mesaId: mesa.id })).some((p) => p.id === pedido.id));
        assert.equal(await repos.pedidos.buscarPorId(99999999), null);
      } finally {
        await repos.cerrar();
      }
    });
  });
}

probarContrato('memoria', async () => crearRepositoriosMemoria());

loadEnvFile();
const config = readConfig({ ...process.env, NODE_ENV: 'test' });
if (config.dataSource === 'mysql') {
  const { crearRepositoriosMysql } = await import('../src/repositories/mysql/index.js');
  probarContrato('mysql', () => crearRepositoriosMysql(config.db));
} else {
  describe('Contrato de repositorios: mysql', () => {
    it('se omite porque DATA_SOURCE no es mysql', { skip: 'Configura DATA_SOURCE=mysql en .env para probar MySQL' }, () => {});
  });
}
