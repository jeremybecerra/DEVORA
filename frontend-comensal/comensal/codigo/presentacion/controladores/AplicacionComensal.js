import { AlmacenamientoSesion } from "../../infraestructura/almacenamiento/AlmacenamientoSesion.js";
import { config } from "../../configuracion/Configuracion.js";
import { crearApi } from "../../infraestructura/fabricas/FabricaApi.js";
import { CarritoCompras } from "../../dominio/modelos/CarritoCompras.js";
import { CalculadoraCuenta } from "../../dominio/modelos/CalculadoraCuenta.js";
import { VistaComensal, formatearDinero } from "../../../interfaz/vistas/VistaComensal.js";
import { obtenerMesaDesdeUrl, validarNombre, validarProductos, validarPedido, validarPago, esperaCobroEfectivo } from "../../dominio/modelos/Validaciones.js";

import { ControladorSesion } from "./ControladorSesion.js";
import { ControladorMenu } from "./ControladorMenu.js";
import { ControladorEventos } from "./ControladorEventos.js";
import { ControladorPedidos } from "./ControladorPedidos.js";
import { ControladorPagos } from "./ControladorPagos.js";

class AplicacionComensal {
  constructor() {
    this.view = new VistaComensal(document.querySelector("#app"), document.querySelector("#header-table"));
    this.api = crearApi();
    this.tableId = obtenerMesaDesdeUrl();
    this.storageKey = `devora:comensal:${config.demo ? "demo" : "api"}:${this.tableId}`;
    this.almacenamiento = new AlmacenamientoSesion(this.storageKey);
    this.session = this.loadSession();
    this.cart = new CarritoCompras(this.session.cart);
    this.products = [];
    this.category = null;
    this.guest = this.session.guest || null;
    this.order = this.session.order || null;
    this.payment = this.session.payment || null;
    this.checkout = null;
    this.summaryOpen = false;
    this.detailId = null;
    this.busy = false;
    this.view.root.addEventListener("click", (event) => this.onClick(event));
    document.querySelector("#call-waiter").addEventListener("click", (event) => this.onClick(event));
    this.view.root.addEventListener("submit", (event) => this.onSubmit(event));
    this.view.root.addEventListener("input", (event) => this.onInput(event));
    this.view.root.addEventListener("keydown", (event) => this.onKeydown(event));
  }
}

// Composición de controladores especializados en la fachada principal.
// Cada método conserva el contexto compartido de la sesión; la UI está aislada en interfaz/.
for (const Controlador of [ControladorSesion, ControladorMenu, ControladorEventos, ControladorPedidos, ControladorPagos]) {
  const metodos = Object.getOwnPropertyDescriptors(Controlador.prototype);
  delete metodos.constructor;
  Object.defineProperties(AplicacionComensal.prototype, metodos);
}

export { AplicacionComensal };
