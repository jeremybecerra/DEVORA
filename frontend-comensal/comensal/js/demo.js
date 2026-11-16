// Datos solo para ?demo=1. Nunca se usan como respaldo ante un error de red.
const products = [
  { id: 1, nombre: "Hamburguesa de la casa", descripcion: "Carne a la parrilla, queso y salsa de la casa.", ingredientes: ["Pan tostado", "Carne de res", "Queso", "Lechuga y tomate", "Salsa de la casa"], categoria: "Platos principales", precio: 42, tiempoEstimado: 14, imagenUrl: "/assets/productos/hamburguesa.jpg", disponible: true },
  { id: 2, nombre: "Pique para uno", descripcion: "Carne, salchicha, papas y verduras frescas.", ingredientes: ["Carne de res", "Salchicha", "Papas fritas", "Tomate y cebolla", "Huevo"], categoria: "Platos principales", precio: 48, tiempoEstimado: 18, imagenUrl: "/assets/productos/pique.jpg", disponible: true },
  { id: 3, nombre: "Ensalada fresca", descripcion: "Hojas verdes, tomate, palta y vinagreta.", ingredientes: ["Hojas verdes", "Tomate", "Palta", "Vinagreta"], categoria: "Platos principales", precio: 31, tiempoEstimado: 9, imagenUrl: "/assets/productos/ensalada.jpg", disponible: true },
  { id: 4, nombre: "Limonada natural", descripcion: "Limón recién exprimido, con hielo.", ingredientes: ["Limón", "Agua", "Hielo"], categoria: "Bebidas", precio: 15, tiempoEstimado: 6, imagenUrl: "/assets/productos/limonada.jpg", disponible: true },
  { id: 5, nombre: "Jugo de temporada", descripcion: "Consulta la fruta disponible hoy.", ingredientes: ["Fruta de temporada", "Agua", "Hielo"], categoria: "Bebidas", precio: 18, tiempoEstimado: 7, imagenUrl: "/assets/productos/jugo.jpg", disponible: true },
  { id: 6, nombre: "Cheesecake", descripcion: "Porción de cheesecake con salsa de frutos rojos.", ingredientes: ["Queso crema", "Base de galleta", "Salsa de frutos rojos"], categoria: "Postres", precio: 25, tiempoEstimado: 5, imagenUrl: "/assets/productos/cheesecake.jpg", disponible: false },
];

const pause = () => new Promise((resolve) => setTimeout(resolve, 350));

export class DemoApi {
  constructor() {
    try {
      this.orders = JSON.parse(globalThis.sessionStorage?.getItem("devora:demo:orders") || "{}") || {};
      this.payments = JSON.parse(globalThis.sessionStorage?.getItem("devora:demo:payments") || "{}") || {};
      this.times = JSON.parse(globalThis.sessionStorage?.getItem("devora:demo:times") || "{}") || {};
    } catch { this.orders = {}; this.payments = {}; this.times = {}; }
  }

  save() {
    try {
      globalThis.sessionStorage?.setItem("devora:demo:orders", JSON.stringify(this.orders));
      globalThis.sessionStorage?.setItem("devora:demo:payments", JSON.stringify(this.payments));
      globalThis.sessionStorage?.setItem("devora:demo:times", JSON.stringify(this.times));
    } catch { /* Los datos de prueba pueden vivir solo en memoria. */ }
  }

  async getMesa(id) {
    await pause();
    if (id === "99") return null;
    return { id, nombre: `Mesa ${id}`, estado: id === "02" ? "cerrada" : "abierta" };
  }

  async getMenu() {
    await pause();
    const menu = products.map((product) => {
      if (!Number.isInteger(this.times[product.id]) || this.times[product.id] < 5 || this.times[product.id] > 20) {
        this.times[product.id] = 5 + Math.floor(Math.random() * 16);
      }
      return { ...product, tiempoEstimado: this.times[product.id] };
    });
    this.save();
    return structuredClone(menu);
  }

  async registerGuest(mesaId, nombre) {
    await pause();
    return { id: `demo-${Date.now()}`, mesaId, nombre };
  }

  async callWaiter(mesaId) {
    await pause();
    return { mesaId, estado: "simulado" };
  }

  async createOrder(mesaId, comensalId, items) {
    await pause();
    if (!items.length) throw new Error("Agrega al menos un producto antes de confirmar.");
    const detalles = items.map(({ productoId, cantidad }) => {
      const product = products.find((p) => p.id === productoId && p.disponible);
      if (!product) throw new Error("Un producto ya no está disponible.");
      return { productoId, nombre: product.nombre, cantidad, precio: product.precio, subtotal: product.precio * cantidad };
    });
    const order = {
      id: `DEMO-${Date.now()}`,
      mesaId, comensalId, estado: "recibido", fecha: new Date().toISOString(),
      detalles, total: detalles.reduce((sum, item) => sum + item.subtotal, 0),
    };
    this.orders[order.id] = order;
    this.save();
    return structuredClone(order);
  }

  async getOrder(id) {
    await pause();
    if (!this.orders[id]) throw new Error("No se encontró el pedido de prueba.");
    return structuredClone(this.orders[id]);
  }

  async addItems(id, items) {
    await pause();
    const order = this.orders[id];
    if (!order) throw new Error("No se encontró el pedido de prueba.");
    if (!items.length) throw new Error("Agrega al menos un producto antes de confirmar.");
    const additions = items.map(({ productoId, cantidad }) => {
      const product = products.find((p) => p.id === productoId && p.disponible);
      if (!product) throw new Error("Un producto ya no está disponible.");
      return { productoId, cantidad, product };
    });
    for (const { productoId, cantidad, product } of additions) {
      const existing = order.detalles.find((p) => p.productoId === productoId);
      if (existing) { existing.cantidad += cantidad; existing.subtotal = existing.precio * existing.cantidad; }
      else order.detalles.push({ productoId, nombre: product.nombre, cantidad, precio: product.precio, subtotal: product.precio * cantidad });
    }
    order.total = order.detalles.reduce((sum, item) => sum + item.subtotal, 0);
    order.estado = "recibido";
    this.save();
    return structuredClone(order);
  }

  async requestPayment(orderId, metodo, propina) {
    await pause();
    const order = this.orders[orderId];
    if (!order) throw new Error("No se encontró el pedido de prueba.");
    const now = Date.now();
    const payment = {
      id: `DEMO-PAGO-${now}`, orderId, metodo, propina,
      totalPagar: Math.round((order.total + propina) * 100) / 100,
      estado: metodo === "efectivo" ? "pendiente_cobro" : "pendiente_pago",
      solicitadoEn: now, qrUrl: null,
    };
    this.payments[payment.id] = payment;
    this.save();
    return structuredClone(payment);
  }

  async getPayment(id) {
    await pause();
    if (!this.payments[id]) throw new Error("No se encontró el pago de prueba.");
    return structuredClone(this.payments[id]);
  }

  async confirmDemoPayment(id) {
    await pause();
    if (!this.payments[id]) throw new Error("No se encontró el pago de prueba.");
    this.payments[id].estado = "pagado";
    this.save();
    return structuredClone(this.payments[id]);
  }

  endSession(orderId, paymentId) {
    delete this.orders[orderId];
    delete this.payments[paymentId];
    this.save();
  }
}
