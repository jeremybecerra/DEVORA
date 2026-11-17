
import { crearApi } from "./api.js";
import { crearVista } from "./view.js";

export async function iniciarPanel({
    documento = globalThis.document,
    fetcher,
    logger = console
} = {}) {
    const api = crearApi(fetcher);
    const vista = crearVista(documento);

    async function cargarMesas() {
        try {
            const mesas = await api.obtenerMesas();
            vista.mostrarMesas(mesas);

        } catch (error) {
            vista.mostrarErrorMesas();
            logger.error(error);
        }
    }

    async function cargarPedidos() {
        vista.mostrarCarga();

        try {
            const pedidos = await api.obtenerPedidos(
                vista.obtenerMesaSeleccionada()
            );

            vista.mostrarPedidos(pedidos);

        } catch (error) {
            vista.mostrarErrorPedidos();
            logger.error(error);
        }
    }

    vista.registrarEventos(cargarPedidos);

    await cargarMesas();
    await cargarPedidos();
}
