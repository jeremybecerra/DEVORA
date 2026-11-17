
export function crearVista(documento) {
    const tabla = documento.getElementById("pedidos");
    const filtro = documento.getElementById("filtroMesa");
    const mensaje = documento.getElementById("mensaje");
    const estadoMesas = documento.getElementById("estadoMesas");
    const botonActualizar = documento.getElementById("actualizar");

    function agregarCelda(fila, contenido) {
        const celda = documento.createElement("td");
        celda.textContent = String(contenido);
        fila.appendChild(celda);
    }

    function mostrarMesas(mesas) {
        filtro.replaceChildren();

        const todas = documento.createElement("option");
        todas.value = "todas";
        todas.textContent = "Todas las mesas";
        filtro.appendChild(todas);

        mesas.forEach(function (mesa) {
            const opcion = documento.createElement("option");
            opcion.value = mesa.id;
            opcion.textContent = mesa.nombre;
            filtro.appendChild(opcion);
        });

        estadoMesas.textContent = "";
    }

    function mostrarPedidos(pedidos) {
        tabla.replaceChildren();

        if (pedidos.length === 0) {
            mensaje.textContent = "No hay pedidos para mostrar.";
            return;
        }

        pedidos.forEach(function (pedido) {
            const fila = documento.createElement("tr");

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

    function mostrarCarga() {
        mensaje.textContent = "Cargando pedidos...";
        tabla.replaceChildren();
    }

    function mostrarErrorMesas() {
        estadoMesas.textContent = "No se pudieron cargar las mesas.";
    }

    function mostrarErrorPedidos() {
        mensaje.textContent = "No se pudieron cargar los pedidos.";
    }

    function obtenerMesaSeleccionada() {
        return filtro.value;
    }

    function registrarEventos(actualizar) {
        filtro.addEventListener("change", actualizar);
        botonActualizar.addEventListener("click", actualizar);
    }

    return {
        mostrarMesas,
        mostrarPedidos,
        mostrarCarga,
        mostrarErrorMesas,
        mostrarErrorPedidos,
        obtenerMesaSeleccionada,
        registrarEventos
    };
}
