export class Cart {
  constructor(saved = {}) {
    this.qty = new Map();
    for (const [id, amount] of Object.entries(saved)) {
      if (Number.isSafeInteger(amount) && amount > 0 && amount <= 99) this.qty.set(String(id), amount);
    }
  }

  get(id) { return this.qty.get(String(id)) || 0; }

  set(id, amount) {
    const key = String(id);
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 99) return false;
    if (amount === 0) this.qty.delete(key);
    else this.qty.set(key, amount);
    return true;
  }

  count() { return [...this.qty.values()].reduce((sum, n) => sum + n, 0); }
  empty() { return this.qty.size === 0; }
  snapshot() { return Object.fromEntries(this.qty); }

  items(products) {
    return products.filter((p) => this.get(p.id) > 0 && p.disponible).map((p) => ({
      productoId: p.id,
      nombre: p.nombre,
      cantidad: this.get(p.id),
      precio: p.precio,
      subtotal: p.precio * this.get(p.id),
    }));
  }

  total(products) { return this.items(products).reduce((sum, item) => sum + item.subtotal, 0); }

  sync(products) {
    const allowed = new Set(products.filter((p) => p.disponible).map((p) => String(p.id)));
    const removed = [];
    for (const id of this.qty.keys()) {
      if (!allowed.has(id)) { this.qty.delete(id); removed.push(id); }
    }
    return removed.length;
  }
}
