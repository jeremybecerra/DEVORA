import mysql from 'mysql2/promise';
import { ConcurrencyError } from '../../domain/errors.js';
import { protegerConexion } from './conexion.js';

/**
 * Implementación MySQL del contrato de repositorios.
 * Usa un pool de conexiones, consultas parametrizadas (evitan inyección SQL) y transacciones
 * cuando una operación escribe en más de una tabla. El esquema esperado está en docs/esquema-mysql.sql.
 */
export async function crearRepositoriosMysql(dbConfig) {
  const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit,
    waitForConnections: true,
    queueLimit: 100,
    connectTimeout: 5000,
    enableKeepAlive: true,
    decimalNumbers: true,
    timezone: 'Z',
    charset: 'utf8mb4',
  });

  try {
    await pool.query('SELECT 1');
  } catch (error) {
    await pool.end().catch(() => {});
    const wrapped = new Error(`No se pudo conectar a MySQL en ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}: ${error.message}`);
    wrapped.code = 'MYSQL_SIN_CONEXION';
    throw wrapped;
  }

  const iso = (fecha) => (fecha ? new Date(fecha).toISOString() : null);

  const aMesa = (fila) => ({ id: String(fila.id), nombre: fila.nombre, estado: fila.estado });
  const aProducto = (fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion ?? '',
    categoria: fila.categoria ?? '',
    precio: Number(fila.precio),
    disponible: Boolean(fila.disponible),
    imagenUrl: fila.imagen_url ?? '',
    tiempoEstimado: fila.tiempo_estimado ?? null,
  });
  const aComensal = (fila) => ({ id: fila.id, mesaId: String(fila.mesa_id), nombre: fila.nombre, creadoEn: iso(fila.creado_en) });
  const aDetalle = (fila) => ({
    productoId: fila.producto_id,
    nombre: fila.nombre_producto,
    cantidad: fila.cantidad,
    precio: Number(fila.precio_unitario),
    subtotal: Number(fila.subtotal),
  });
  const aPedido = (fila, detalles) => ({
    id: fila.id,
    mesaId: String(fila.mesa_id),
    comensalId: fila.comensal_id,
    comensalNombre: fila.comensal_nombre ?? '',
    estado: fila.estado,
    fecha: iso(fila.creado_en),
    actualizadoEn: iso(fila.actualizado_en),
    version: fila.version,
    detalles,
    total: Number(fila.total),
  });

  const SELECT_PEDIDO = `
    SELECT p.id, p.mesa_id, p.comensal_id, c.nombre AS comensal_nombre, p.estado, p.total, p.version, p.creado_en, p.actualizado_en
    FROM pedidos p
    JOIN comensales c ON c.id = p.comensal_id`;

  /** Ejecuta una función dentro de una transacción; si algo falla, deshace todos los cambios. */
  async function enTransaccion(trabajo) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      const resultado = await trabajo(conexion);
      await conexion.commit();
      return resultado;
    } catch (error) {
      await conexion.rollback().catch(() => {});
      throw error;
    } finally {
      conexion.release();
    }
  }

  async function insertarDetalles(conexion, pedidoId, detalles) {
    const filas = detalles.map((d) => [pedidoId, d.productoId, d.nombre, d.cantidad, d.precio, d.subtotal]);
    await conexion.query(
      'INSERT INTO detalles_pedido (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal) VALUES ?',
      [filas],
    );
  }

  /** Si el pedido existe pero no se actualizó, es porque otra solicitud lo cambió antes. */
  async function lanzarSiCambio(ejecutor, id) {
    const [filas] = await ejecutor.execute('SELECT id FROM pedidos WHERE id = ?', [Number(id)]);
    if (filas.length) throw new ConcurrencyError();
  }

  async function detallesDe(ids) {
    if (!ids.length) return new Map();
    const [filas] = await pool.query(
      'SELECT pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal FROM detalles_pedido WHERE pedido_id IN (?) ORDER BY id',
      [ids],
    );
    const porPedido = new Map(ids.map((id) => [id, []]));
    for (const fila of filas) porPedido.get(fila.pedido_id)?.push(aDetalle(fila));
    return porPedido;
  }

  const pedidos = {
    async crear({ mesaId, comensalId, estado, detalles, total, claveIdempotencia = null }) {
      try {
        const id = await enTransaccion(async (conexion) => {
          const [resultado] = await conexion.execute(
            'INSERT INTO pedidos (mesa_id, comensal_id, estado, total, clave_idempotencia) VALUES (?, ?, ?, ?, ?)',
            [mesaId, comensalId, estado, total, claveIdempotencia],
          );
          await insertarDetalles(conexion, resultado.insertId, detalles);
          return resultado.insertId;
        });
        return pedidos.buscarPorId(id);
      } catch (error) {
        // Dos envíos simultáneos con la misma clave: el segundo devuelve el pedido del primero.
        if (error.code === 'ER_DUP_ENTRY' && claveIdempotencia) return pedidos.buscarPorClaveIdempotencia(claveIdempotencia);
        throw error;
      }
    },
    async buscarPorId(id) {
      const [filas] = await pool.execute(`${SELECT_PEDIDO} WHERE p.id = ?`, [Number(id)]);
      if (!filas.length) return null;
      const detalles = await detallesDe([filas[0].id]);
      return aPedido(filas[0], detalles.get(filas[0].id));
    },
    async buscarPorClaveIdempotencia(clave) {
      const [filas] = await pool.execute('SELECT id FROM pedidos WHERE clave_idempotencia = ?', [clave]);
      return filas.length ? pedidos.buscarPorId(filas[0].id) : null;
    },
    async listar({ mesaId, estado } = {}) {
      const condiciones = [];
      const valores = [];
      if (mesaId) { condiciones.push('p.mesa_id = ?'); valores.push(mesaId); }
      if (estado) { condiciones.push('p.estado = ?'); valores.push(estado); }
      const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
      const [filas] = await pool.execute(`${SELECT_PEDIDO} ${where} ORDER BY p.creado_en DESC, p.id DESC`, valores);
      const detalles = await detallesDe(filas.map((fila) => fila.id));
      return filas.map((fila) => aPedido(fila, detalles.get(fila.id)));
    },
    async actualizarDetalles(id, { detalles, total, estado }, versionEsperada) {
      const actualizado = await enTransaccion(async (conexion) => {
        // El UPDATE solo afecta la fila si nadie la cambió desde que se leyó (misma versión).
        const [resultado] = await conexion.execute(
          'UPDATE pedidos SET total = ?, estado = ?, version = version + 1 WHERE id = ? AND version = ?',
          [total, estado, Number(id), versionEsperada],
        );
        if (!resultado.affectedRows) {
          await lanzarSiCambio(conexion, id);
          return false;
        }
        await conexion.execute('DELETE FROM detalles_pedido WHERE pedido_id = ?', [Number(id)]);
        await insertarDetalles(conexion, Number(id), detalles);
        return true;
      });
      return actualizado ? pedidos.buscarPorId(id) : null;
    },
    async actualizarEstado(id, estado, versionEsperada) {
      const [resultado] = await pool.execute(
        'UPDATE pedidos SET estado = ?, version = version + 1 WHERE id = ? AND version = ?',
        [estado, Number(id), versionEsperada],
      );
      if (!resultado.affectedRows) {
        await lanzarSiCambio(pool, id);
        return null;
      }
      return pedidos.buscarPorId(id);
    },
  };

  return protegerConexion({
    fuente: 'mysql',
    async verificarSalud() {
      await pool.query('SELECT 1');
    },
    mesas: {
      async listar() {
        const [filas] = await pool.execute('SELECT id, nombre, estado FROM mesas ORDER BY id');
        return filas.map(aMesa);
      },
      async buscarPorId(id) {
        const [filas] = await pool.execute('SELECT id, nombre, estado FROM mesas WHERE id = ?', [String(id)]);
        return filas.length ? aMesa(filas[0]) : null;
      },
    },
    productos: {
      async listar() {
        const [filas] = await pool.execute(
          'SELECT id, nombre, descripcion, categoria, precio, disponible, imagen_url, tiempo_estimado FROM productos ORDER BY categoria, nombre',
        );
        return filas.map(aProducto);
      },
      async buscarPorIds(ids) {
        if (!ids.length) return [];
        const [filas] = await pool.query(
          'SELECT id, nombre, descripcion, categoria, precio, disponible, imagen_url, tiempo_estimado FROM productos WHERE id IN (?)',
          [ids.map(Number)],
        );
        return filas.map(aProducto);
      },
    },
    comensales: {
      async crear({ mesaId, nombre }) {
        const [resultado] = await pool.execute('INSERT INTO comensales (mesa_id, nombre) VALUES (?, ?)', [mesaId, nombre]);
        return this.buscarPorId(resultado.insertId);
      },
      async buscarPorId(id) {
        const [filas] = await pool.execute('SELECT id, mesa_id, nombre, creado_en FROM comensales WHERE id = ?', [Number(id)]);
        return filas.length ? aComensal(filas[0]) : null;
      },
    },
    pedidos,
    async cerrar() {
      await pool.end();
    },
  });
}
