import test from 'node:test';
import assert from 'node:assert/strict';
import { IEstrategiaPago } from '../comensal/codigo/dominio/estrategias/IEstrategiaPago.js';
import { EstrategiaPagoEfectivo } from '../comensal/codigo/dominio/estrategias/EstrategiaPagoEfectivo.js';
import { EstrategiaPagoQR } from '../comensal/codigo/dominio/estrategias/EstrategiaPagoQR.js';
import { FabricaEstrategiasPago } from '../comensal/codigo/infraestructura/fabricas/FabricaEstrategiasPago.js';
import { FabricaRepositorios } from '../comensal/codigo/infraestructura/fabricas/FabricaApi.js';
import { IRepositorioComensal } from '../comensal/codigo/dominio/contratos/IRepositorioComensal.js';
import { RepositorioComensalSimulado } from '../comensal/codigo/infraestructura/repositorios/RepositorioComensalSimulado.js';
import { RepositorioComensalHttp } from '../comensal/codigo/infraestructura/repositorios/RepositorioComensalHttp.js';
import { VistaComensal } from '../comensal/interfaz/vistas/VistaComensal.js';
import { AplicacionComensal } from '../comensal/codigo/presentacion/controladores/AplicacionComensal.js';

test('Strategy: ambas variantes respetan el contrato IEstrategiaPago', () => {
  assert.ok(new EstrategiaPagoEfectivo() instanceof IEstrategiaPago);
  assert.ok(new EstrategiaPagoQR() instanceof IEstrategiaPago);
  assert.equal(FabricaEstrategiasPago.crear('efectivo').metodo, 'efectivo');
  assert.equal(FabricaEstrategiasPago.crear('qr').textoBoton, 'Generar QR para pagar');
  assert.throws(() => FabricaEstrategiasPago.crear('tarjeta'), /no permitido/);
});

test('Factory + Repository: el modo explícito define el repositorio', () => {
  const simulado = FabricaRepositorios.crearRepositorioComensal(true);
  const real = FabricaRepositorios.crearRepositorioComensal(false);
  assert.ok(simulado instanceof IRepositorioComensal);
  assert.ok(real instanceof IRepositorioComensal);
  assert.ok(simulado instanceof RepositorioComensalSimulado);
  assert.ok(real instanceof RepositorioComensalHttp);
});

test('MVC: los métodos de las vistas y controladores son accesibles desde sus fachadas', () => {
  for (const metodo of ['menu','receipt','payment','name','thankYou']) assert.equal(typeof VistaComensal.prototype[metodo], 'function');
  for (const metodo of ['onClick','confirm','requestPayment','loadMenu','init']) assert.equal(typeof AplicacionComensal.prototype[metodo], 'function');
});
