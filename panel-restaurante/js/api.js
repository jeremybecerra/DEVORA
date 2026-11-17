
import { API_BASE } from "./config.js";

export function crearApi(fetcher = (...args) => globalThis.fetch(...args)) {
    async function obtenerLista(url, mensajeFormato) {
        const respuesta = await fetcher(url);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
            throw new Error(mensajeFormato);
        }

        return datos;
    }

    function obtenerMesas() {
        return obtenerLista(
            `${API_BASE}/mesas`,
            "Formato de mesas incorrecto."
        );
    }

    function obtenerPedidos(mesaId = "todas") {
        let url = `${API_BASE}/pedidos`;

        if (mesaId !== "todas") {
            url += `?mesaId=${encodeURIComponent(mesaId)}`;
        }

        return obtenerLista(
            url,
            "Formato de pedidos incorrecto."
        );
    }

    return { obtenerMesas, obtenerPedidos };
}
