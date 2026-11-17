import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ServiceUnavailableError } from '../src/domain/errors.js';
import { crearRepositoriosMemoria } from '../src/repositories/memory/index.js';
import { esErrorDeConexion, protegerConexion } from '../src/repositories/mysql/conexion.js';
import { levantarApi } from './helpers.js';

/**
 * Pruebas de resiliencia: si una parte falla (por ejemplo la base de datos), el error queda
 * aislado en esa solicitud, el resto de la API sigue respondiendo y el servidor no se cae.
 */

const errorDeConexion = () => Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3306'), { code: 'ECONNREFUSED' });

describe('Resiliencia ante fallas', () => {
  it('si la base de datos no responde, /api/salud informa 503 «degradado»', async () => {
    const repositorios = crearRepositoriosMemoria();
    repositorios.verificarSalud = async () => { throw errorDeConexion(); };
    const { api, cerrar } = await levantarApi({ repositorios });
    try {
      const { status, body } = await api('GET', '/api/salud');
      assert.equal(status, 503);
      assert.equal(body.estado, 'degradado');
      assert.equal(body.baseDatos, 'sin_conexion');
    } finally {
      await cerrar();
    }
  });

  it('una caída de datos responde 503 solo en esa ruta; las demás siguen funcionando', async () => {
    const repositorios = crearRepositoriosMemoria();
    repositorios.productos.listar = async () => { throw new ServiceUnavailableError(); };
    const { api, cerrar } = await levantarApi({ repositorios });
    try {
      const menu = await api('GET', '/api/productos');
      assert.equal(menu.status, 503);
      assert.equal(menu.body.codigo, 'SERVICIO_NO_DISPONIBLE');

      const mesa = await api('GET', '/api/mesas/01');
      assert.equal(mesa.status, 200);
      const comensal = await api('POST', '/api/comensales', { mesaId: '01', nombre: 'Pame' });
      assert.equal(comensal.status, 201);
    } finally {
      await cerrar();
    }
  });

  it('un error inesperado responde 500 sin mostrar detalles internos y el servidor sigue vivo', async () => {
    const repositorios = crearRepositoriosMemoria();
    repositorios.mesas.listar = async () => { throw new Error('detalle interno secreto'); };
    const { api, cerrar } = await levantarApi({ repositorios });
    try {
      const fallo = await api('GET', '/api/mesas');
      assert.equal(fallo.status, 500);
      assert.equal(fallo.body.codigo, 'ERROR_INTERNO');
      assert.doesNotMatch(JSON.stringify(fallo.body), /secreto/);
      assert.equal((await api('GET', '/api/productos')).status, 200);
    } finally {
      await cerrar();
    }
  });
});

describe('Protección de la conexión a MySQL', () => {
  it('reconoce los errores de conexión del driver', () => {
    assert.equal(esErrorDeConexion(errorDeConexion()), true);
    assert.equal(esErrorDeConexion(Object.assign(new Error('perdida'), { code: 'PROTOCOL_CONNECTION_LOST' })), true);
    assert.equal(esErrorDeConexion(Object.assign(new Error('sintaxis'), { code: 'ER_PARSE_ERROR' })), false);
  });

  it('convierte un error de conexión en 503 y deja pasar los demás errores', async () => {
    const protegido = protegerConexion({
      fuente: 'prueba',
      async verificarSalud() { throw errorDeConexion(); },
      async cerrar() {},
      mesas: {
        async listar() { throw errorDeConexion(); },
        async buscarPorId() { throw new TypeError('error de programación'); },
        async contexto() { return this.listar === undefined ? 'sin contexto' : 'con contexto'; },
      },
    });
    await assert.rejects(protegido.mesas.listar(), ServiceUnavailableError);
    await assert.rejects(protegido.verificarSalud(), ServiceUnavailableError);
    await assert.rejects(protegido.mesas.buscarPorId('01'), TypeError);
    assert.equal(await protegido.mesas.contexto(), 'con contexto');
    assert.equal(protegido.fuente, 'prueba');
  });
});
