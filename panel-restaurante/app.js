
const API_BASE = "http://localhost:3000/api";

// Elementos del panel
const tabla = document.getElementById("pedidos");
const filtro = document.getElementById("filtroMesa");
const mensaje = document.getElementById("mensaje");
const estadoMesas = document.getElementById("estadoMesas");
const botonActualizar = document.getElementById("actualizar");

// Crear una celda de forma segura
function agregarCelda(fila, contenido) {
    const celda = document.createElement("td");
    celda.textContent = String(contenido);
    fila.appendChild(celda);
}

// Mostrar pedidos en la tabla
function mostrarPedidos(pedidos) {
    tabla.replaceChildren();

    if (pedidos.length === 0) {
        mensaje.textContent = "No hay pedidos para mostrar.";
        return;
    }

    pedidos.forEach(function (pedido) {
        const fila = document.createElement("tr");

        const productos = Array.isArray(pedido.detalles)
            ? pedido.detalles.map(function (detalle) {
                return `${detalle.nombre} x${detalle.cantidad}`;
            }).join(", ")
            : "Sin detalles";

        agregarCelda(fila, pedido.mesaId);
        agregarCelda(fila, pedido.comensalNombre);
        agregarCelda(fila, productos);
        agregarCelda(fila, `Bs ${pedido.total}`);

        tabla.appendChild(fila);
    });

    mensaje.textContent = `${pedidos.length} pedido(s) encontrado(s).`;
}

// Obtener las mesas de la API
async function cargarMesas() {
    try {
        const respuesta = await fetch(`${API_BASE}/mesas`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las mesas.");
        }

        const mesas = await respuesta.json();

        if (!Array.isArray(mesas)) {
            throw new Error("Formato de mesas incorrecto.");
        }

        filtro.replaceChildren();

        const todas = document.createElement("option");
        todas.value = "todas";
        todas.textContent = "Todas las mesas";
        filtro.appendChild(todas);

        mesas.forEach(function (mesa) {
            const opcion = document.createElement("option");
            opcion.value = mesa.id;
            opcion.textContent = mesa.nombre;
            filtro.appendChild(opcion);
        });

        estadoMesas.textContent = "";

    } catch (error) {
        estadoMesas.textContent = "No se pudieron cargar las mesas.";
        console.error(error);
    }
}

// Obtener pedidos desde la API de Pamela
async function cargarPedidos() {
    mensaje.textContent = "Cargando pedidos...";
    tabla.replaceChildren();

    try {
        let url = `${API_BASE}/pedidos`;

        if (filtro.value !== "todas") {
            url += `?mesaId=${encodeURIComponent(filtro.value)}`;
        }

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const pedidos = await respuesta.json();

        if (!Array.isArray(pedidos)) {
            throw new Error("Formato de pedidos incorrecto.");
        }

        mostrarPedidos(pedidos);

    } catch (error) {
        mensaje.textContent = "No se pudieron cargar los pedidos.";
        console.error(error);
    }
}

// Eventos del usuario
filtro.addEventListener("change", cargarPedidos);
botonActualizar.addEventListener("click", cargarPedidos);

// Inicializar el panel
async function iniciarPanel() {
    await cargarMesas();
    await cargarPedidos();
}

iniciarPanel();
