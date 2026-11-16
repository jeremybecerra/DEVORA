/**
 * Los montos se calculan en centavos (enteros) para evitar errores de punto flotante:
 * 0.1 + 0.2 da 0.30000000000000004, pero 10 + 20 centavos da 30 exacto.
 */
export function toCents(amount) {
  const number = Number(amount);
  if (!Number.isFinite(number) || number < 0) throw new TypeError(`Monto inválido: ${amount}`);
  return Math.round(number * 100);
}

export function fromCents(cents) {
  return Math.round(cents) / 100;
}

/** Subtotal de una línea: precio unitario × cantidad, devuelto en bolivianos. */
export function lineSubtotal(unitPrice, quantity) {
  return fromCents(toCents(unitPrice) * quantity);
}

/** Suma de subtotales en bolivianos, sin acumular error de redondeo. */
export function sumAmounts(amounts) {
  return fromCents(amounts.reduce((total, amount) => total + toCents(amount), 0));
}
