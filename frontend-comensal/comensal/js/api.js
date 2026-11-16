import { config } from "./config.js";
import { DemoApi } from "./demo.js";

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = "ApiError"; this.status = status; }
}

// Adapter: the rest of the UI uses these methods, independently of HTTP details.
export class HttpApi {
  constructor(baseUrl = config.baseUrl, routes = config.routes, fetcher = fetch) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.routes = routes;
    this.fetcher = fetcher;
  }

  async request(path, options = {}) {
    let response;
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...options,
        headers: { Accept: "application/json", "Content-Type": "application/json", ...options.headers },
      });
    } catch {
      throw new ApiError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    }
    let data;
    try { data = await response.json(); }
    catch { throw new ApiError("El servidor devolvió una respuesta que no se puede leer.", response.status); }
    if (!response.ok) {
      const message = typeof data?.mensaje === "string" ? data.mensaje : this.errorMessage(response.status);
      throw new ApiError(message, response.status);
    }
    return data;
  }

  errorMessage(status) {
    if (status === 404) return "No se encontró el recurso solicitado.";
    if (status === 409) return "La mesa o un producto ya no está disponible.";
    if (status >= 400 && status < 500) return "Revisa los datos e inténtalo de nuevo.";
    return "El servidor no pudo completar la solicitud. Inténtalo de nuevo.";
  }

  async getMesa(id) {
    try { return await this.request(this.routes.mesa(id)); }
    catch (error) { if (error.status === 404) return null; throw error; }
  }

  async getMenu() {
    const data = await this.request(this.routes.menu);
    if (!Array.isArray(data)) throw new ApiError("El formato del menú no es válido.");
    return data;
  }

  callWaiter(mesaId, comensalId = null) {
    return this.request(this.routes.llamarMesero(mesaId), { method: "POST", body: JSON.stringify({ comensalId }) });
  }

  registerGuest(mesaId, nombre) {
    return this.request(this.routes.comensales, { method: "POST", body: JSON.stringify({ mesaId, nombre }) });
  }

  createOrder(mesaId, comensalId, items) {
    return this.request(this.routes.pedidos, { method: "POST", body: JSON.stringify({ mesaId, comensalId, items }) });
  }

  addItems(orderId, items) {
    return this.request(this.routes.agregar(orderId), { method: "POST", body: JSON.stringify({ items }) });
  }

  requestPayment(orderId, metodo, propina) {
    return this.request(this.routes.pagos(orderId), { method: "POST", body: JSON.stringify({ metodo, propina }) });
  }

  getPayment(id) { return this.request(this.routes.pago(id)); }

  getOrder(id) { return this.request(this.routes.pedido(id)); }
}

// Strategy selection is explicit. A failed real API call never switches to DemoApi.
export function createApi() { return config.demo ? new DemoApi() : new HttpApi(); }
