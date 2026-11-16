import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ValidationError } from '../src/domain/errors.js';
import { lineSubtotal, sumAmounts, toCents } from '../src/domain/money.js';
import { parseItems, parseMesaId, parseNombre, parsePositiveId } from '../src/domain/validators.js';
import { readConfig } from '../src/config/env.js';

describe('Montos en centavos', () => {
  it('suma sin errores de punto flotante', () => {
    assert.equal(0.1 + 0.2 === 0.3, false);
    assert.equal(sumAmounts([0.1, 0.2]), 0.3);
  });
  it('calcula subtotales por línea', () => {
    assert.equal(lineSubtotal(8, 2), 16);
    assert.equal(lineSubtotal(12.35, 3), 37.05);
  });
  it('rechaza montos negativos', () => {
    assert.throws(() => toCents(-1), TypeError);
  });
});

describe('Validación del nombre del comensal', () => {
  it('normaliza espacios', () => assert.equal(parseNombre('  Pame   Condori '), 'Pame Condori'));
  it('rechaza nombres de menos de 2 caracteres', () => assert.throws(() => parseNombre(' a '), ValidationError));
  it('rechaza nombres de más de 40 caracteres', () => assert.throws(() => parseNombre('x'.repeat(41)), ValidationError));
  it('rechaza valores que no son texto', () => assert.throws(() => parseNombre(123), ValidationError));
});

describe('Validación de identificadores', () => {
  it('acepta códigos de mesa como "01"', () => assert.equal(parseMesaId(' 01 '), '01'));
  it('rechaza códigos de mesa con caracteres raros', () => assert.throws(() => parseMesaId('01; DROP'), ValidationError));
  it('acepta ids numéricos enviados como texto', () => assert.equal(parsePositiveId('7', 'id', 'x'), 7));
  it('rechaza ids cero, negativos o decimales', () => {
    for (const valor of [0, -1, 1.5, 'abc', '', null]) assert.throws(() => parsePositiveId(valor, 'id', 'x'), ValidationError);
  });
});

describe('Validación de los productos del pedido', () => {
  it('rechaza una lista vacía (CA-02)', () => {
    assert.throws(() => parseItems([]), (error) => error instanceof ValidationError && /al menos un producto/.test(error.message));
  });
  it('rechaza cantidades fuera de rango', () => {
    for (const cantidad of [0, -2, 1.5, 21, 'dos']) assert.throws(() => parseItems([{ productoId: 1, cantidad }]), ValidationError);
  });
  it('junta productos repetidos sumando sus cantidades', () => {
    assert.deepEqual(parseItems([{ productoId: 1, cantidad: 1 }, { productoId: 1, cantidad: 2 }]), [{ productoId: 1, cantidad: 3 }]);
  });
  it('informa todos los campos con error', () => {
    try {
      parseItems([{ productoId: 'x', cantidad: 1 }, { productoId: 2, cantidad: 0 }]);
      assert.fail('debía lanzar un error');
    } catch (error) {
      assert.equal(error.details.length, 2);
    }
  });
});

describe('Configuración', () => {
  it('usa valores por defecto seguros', () => {
    const config = readConfig({});
    assert.equal(config.port, 3000);
    assert.equal(config.dataSource, 'memory');
  });
  it('falla al arrancar si MySQL no tiene credenciales', () => {
    assert.throws(() => readConfig({ DATA_SOURCE: 'mysql' }), /DB_USER es obligatorio/);
  });
  it('rechaza una fuente de datos desconocida', () => {
    assert.throws(() => readConfig({ DATA_SOURCE: 'excel' }), /DATA_SOURCE/);
  });
});
