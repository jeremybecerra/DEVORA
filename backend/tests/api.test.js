import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { levantarApi, registrarComensal } from './helpers.js';

let api;
let cerrar;

beforeEach(async () => { ({ api, cerrar } = await levantarApi()); });
afterEach(async () => { await cerrar(); });

describe('Salud y rutas', () => {
  it('GET /api/salud indica la fuente de datos', async () => {
    const { status, body } = await api('GET', '/api/salud');
    assert.equal(status, 200);
    assert.equal(body.estado, 'ok');
    assert.equal(body.fuenteDatos, 'memory');
  });
  it('una ruta inexistente responde 404 en JSON', async () => {
    const { status, body } = await api('GET', '/api/no-existe');
    assert.equal(status, 404);
    assert.equal(body.codigo, 'RUTA_NO_ENCONTRADA');
  });
  it('un JSON mal formado responde 400 con mensaje claro', async () => {
    const { status, body } = await api('POST', '/api/comensales', '{ nombre: ');
    assert.equal(status, 400);
    assert.equal(body.codigo, 'JSON_INVALIDO');
  });
  it('responde los encabezados de CORS para el frontend', async () => {
    const { headers } = await api('GET', '/api/productos', undefined, { Origin: 'https://devorap.netlify.app' });
    assert.ok(headers.get('access-control-allow-origin'));
  });
});

describe('Mesas', () => {
  it('lista las mesas para el filtro del panel', async () => {
    const { status, body } = await api('GET', '/api/mesas');
    assert.equal(status, 200);
    assert.ok(body.length >= 8);
  });
  it('GET /api/mesas/01 devuelve una mesa abierta', async () => {
    const { status, body } = await api('GET', '/api/mesas/01');
    assert.equal(status, 200);
    assert.deepEqual(body, { id: '01', nombre: 'Mesa 01', estado: 'abierta' });
  });
  it('una mesa inexistente responde 404', async () => {
    const { status, body } = await api('GET', '/api/mesas/99');
    assert.equal(status, 404);
    assert.match(body.mensaje, /no existe/);
  });
});

describe('Productos', () => {
  it('devuelve el menú como lista con los campos que usa el frontend', async () => {
    const { status, body } = await api('GET', '/api/productos');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
    for (const campo of ['id', 'nombre', 'descripcion', 'categoria', 'precio', 'disponible']) assert.ok(campo in body[0], campo);
  });
  it('puede ocultar los productos agotados', async () => {
    const { body } = await api('GET', '/api/productos?disponibles=true');
    assert.ok(body.every((producto) => producto.disponible));
  });
});

describe('Comensales', () => {
  it('registra un comensal en una mesa abierta (201)', async () => {
    const { status, body, headers } = await api('POST', '/api/comensales', { mesaId: '01', nombre: '  Pame  ' });
    assert.equal(status, 201);
    assert.equal(body.nombre, 'Pame');
    assert.equal(body.mesaId, '01');
    assert.match(headers.get('location'), /\/api\/comensales\/\d+$/);
  });
  it('rechaza un nombre vacío (400)', async () => {
    const { status, body } = await api('POST', '/api/comensales', { mesaId: '01', nombre: ' ' });
    assert.equal(status, 400);
    assert.equal(body.codigo, 'DATOS_INVALIDOS');
    assert.equal(body.detalles[0].campo, 'nombre');
  });
  it('rechaza una mesa cerrada (409)', async () => {
    const { status, body } = await api('POST', '/api/comensales', { mesaId: '08', nombre: 'Ana' });
    assert.equal(status, 409);
    assert.equal(body.codigo, 'MESA_CERRADA');
  });
  it('rechaza una mesa que no existe (404)', async () => {
    const { status } = await api('POST', '/api/comensales', { mesaId: '99', nombre: 'Ana' });
    assert.equal(status, 404);
  });
});

describe('Pedidos', () => {
  it('CA-01: un pedido válido se registra con el total calculado desde el menú', async () => {
    const comensalId = await registrarComensal(api);
    const { status, body } = await api('POST', '/api/pedidos', {
      mesaId: '01', comensalId, items: [{ productoId: 1, cantidad: 1 }, { productoId: 4, cantidad: 2 }],
    });
    assert.equal(status, 201);
    assert.equal(body.estado, 'recibido');
    assert.equal(body.total, 51);
    assert.equal(body.comensalNombre, 'Pame');
    assert.deepEqual(body.detalles.map((d) => [d.nombre, d.cantidad, d.precio, d.subtotal]), [
      ['Silpancho', 1, 35, 35], ['Salteña de pollo', 2, 8, 16],
    ]);
  });

  it('CA-02: un pedido vacío se rechaza y no se guarda nada', async () => {
    const comensalId = await registrarComensal(api);
    const { status, body } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [] });
    assert.equal(status, 400);
    assert.match(body.mensaje, /al menos un producto/);
    const lista = await api('GET', '/api/pedidos?mesaId=01');
    assert.equal(lista.body.length, 0);
  });

  it('ignora cualquier precio que envíe el celular', async () => {
    const comensalId = await registrarComensal(api);
    const { body } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 1, cantidad: 1, precio: 0.5 }] });
    assert.equal(body.total, 35);
  });

  it('rechaza un producto agotado (409) sin registrar el pedido', async () => {
    const comensalId = await registrarComensal(api);
    const { status, body } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 9, cantidad: 1 }] });
    assert.equal(status, 409);
    assert.equal(body.codigo, 'PRODUCTO_NO_DISPONIBLE');
    assert.equal((await api('GET', '/api/pedidos')).body.length, 0);
  });

  it('rechaza un producto que no existe (404)', async () => {
    const comensalId = await registrarComensal(api);
    const { status } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 999, cantidad: 1 }] });
    assert.equal(status, 404);
  });

  it('rechaza cantidades inválidas (400)', async () => {
    const comensalId = await registrarComensal(api);
    const { status, body } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 1, cantidad: 0 }] });
    assert.equal(status, 400);
    assert.equal(body.detalles[0].campo, 'items[0].cantidad');
  });

  it('rechaza un comensal de otra mesa (409)', async () => {
    const comensalId = await registrarComensal(api, '02');
    const { status, body } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 1, cantidad: 1 }] });
    assert.equal(status, 409);
    assert.equal(body.codigo, 'COMENSAL_OTRA_MESA');
  });

  it('CA-07: la misma Idempotency-Key no duplica el pedido', async () => {
    const comensalId = await registrarComensal(api);
    const cuerpo = { mesaId: '01', comensalId, items: [{ productoId: 5, cantidad: 1 }] };
    const primero = await api('POST', '/api/pedidos', cuerpo, { 'Idempotency-Key': 'pame-001' });
    const segundo = await api('POST', '/api/pedidos', cuerpo, { 'Idempotency-Key': 'pame-001' });
    assert.equal(primero.status, 201);
    assert.equal(segundo.status, 200);
    assert.equal(segundo.body.id, primero.body.id);
    assert.equal((await api('GET', '/api/pedidos')).body.length, 1);
  });

  it('CA-07: la misma clave usada por otro comensal no devuelve un pedido ajeno', async () => {
    const ana = await registrarComensal(api, '01', 'Ana');
    const luis = await registrarComensal(api, '02', 'Luis');
    const deAna = await api('POST', '/api/pedidos', { mesaId: '01', comensalId: ana, items: [{ productoId: 1, cantidad: 1 }] }, { 'Idempotency-Key': 'clave-123' });
    const deLuis = await api('POST', '/api/pedidos', { mesaId: '02', comensalId: luis, items: [{ productoId: 5, cantidad: 1 }] }, { 'Idempotency-Key': 'clave-123' });
    assert.equal(deLuis.status, 201);
    assert.notEqual(deLuis.body.id, deAna.body.id);
    assert.equal(deLuis.body.comensalNombre, 'Luis');
    assert.equal(deLuis.body.total, 12);
  });

  it('GET /api/pedidos/:id devuelve el pedido; uno inexistente da 404', async () => {
    const comensalId = await registrarComensal(api);
    const creado = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 2, cantidad: 1 }] });
    assert.equal((await api('GET', `/api/pedidos/${creado.body.id}`)).body.total, 52);
    assert.equal((await api('GET', '/api/pedidos/9999')).status, 404);
    assert.equal((await api('GET', '/api/pedidos/abc')).status, 400);
  });

  it('agregar productos suma cantidades y recalcula el total', async () => {
    const comensalId = await registrarComensal(api);
    const creado = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 4, cantidad: 1 }] });
    const { status, body } = await api('POST', `/api/pedidos/${creado.body.id}/items`, { items: [{ productoId: 4, cantidad: 2 }, { productoId: 5, cantidad: 1 }] });
    assert.equal(status, 200);
    assert.equal(body.total, 36);
    assert.deepEqual(body.detalles.map((d) => [d.productoId, d.cantidad]), [[4, 3], [5, 1]]);
  });

  it('el panel lista los pedidos de una mesa con el nombre del comensal', async () => {
    const pame = await registrarComensal(api, '05', 'Pame');
    const luis = await registrarComensal(api, '05', 'Luis');
    const otra = await registrarComensal(api, '03', 'Ana');
    await api('POST', '/api/pedidos', { mesaId: '05', comensalId: pame, items: [{ productoId: 1, cantidad: 1 }] });
    await api('POST', '/api/pedidos', { mesaId: '05', comensalId: luis, items: [{ productoId: 5, cantidad: 2 }] });
    await api('POST', '/api/pedidos', { mesaId: '03', comensalId: otra, items: [{ productoId: 3, cantidad: 1 }] });

    const porQuery = await api('GET', '/api/pedidos?mesaId=05');
    const porRuta = await api('GET', '/api/mesas/05/pedidos');
    assert.equal(porQuery.body.length, 2);
    assert.deepEqual(porQuery.body.map((p) => p.comensalNombre).sort(), ['Luis', 'Pame']);
    assert.deepEqual(porRuta.body, porQuery.body);
    assert.equal((await api('GET', '/api/pedidos?mesaId=99')).status, 404);
  });

  it('el panel cambia el estado respetando las transiciones', async () => {
    const comensalId = await registrarComensal(api);
    const { body: pedido } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 1, cantidad: 1 }] });
    const ok = await api('PATCH', `/api/pedidos/${pedido.id}/estado`, { estado: 'en_preparacion' });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.estado, 'en_preparacion');
    const invalido = await api('PATCH', `/api/pedidos/${pedido.id}/estado`, { estado: 'recibido' });
    assert.equal(invalido.status, 409);
    assert.equal(invalido.body.codigo, 'TRANSICION_INVALIDA');
  });

  it('no deja agregar productos a un pedido entregado', async () => {
    const comensalId = await registrarComensal(api);
    const { body: pedido } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 1, cantidad: 1 }] });
    for (const estado of ['en_preparacion', 'listo', 'entregado']) await api('PATCH', `/api/pedidos/${pedido.id}/estado`, { estado });
    const { status, body } = await api('POST', `/api/pedidos/${pedido.id}/items`, { items: [{ productoId: 5, cantidad: 1 }] });
    assert.equal(status, 409);
    assert.equal(body.codigo, 'PEDIDO_CERRADO');
  });
});

describe('Funciones fuera del alcance del primer incremento', () => {
  it('pagos y llamadas responden 501 con un mensaje para el usuario', async () => {
    const comensalId = await registrarComensal(api);
    const { body: pedido } = await api('POST', '/api/pedidos', { mesaId: '01', comensalId, items: [{ productoId: 1, cantidad: 1 }] });
    const pago = await api('POST', `/api/pedidos/${pedido.id}/pagos`, { metodo: 'qr', propina: 0 });
    const llamada = await api('POST', '/api/mesas/01/llamadas', { comensalId });
    assert.equal(pago.status, 501);
    assert.equal(llamada.status, 501);
    assert.match(pago.body.mensaje, /siguiente incremento/);
  });
});
