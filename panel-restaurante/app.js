
// Pedidos de prueba
const pedidos = [
    {
        mesa: 5,
        comensal: "Juan",
        productos: "Hamburguesa x1",
        total: 35
    },
    {
        mesa: 3,
        comensal: "María",
        productos: "Pizza x1",
        total: 40
    },
    {
        mesa: 5,
        comensal: "Pedro",
        productos: "Refresco x2",
        total: 20
    }
];

// Buscar elementos del HTML
const tabla = document.getElementById("pedidos");
const filtro = document.getElementById("filtroMesa");

// Función para mostrar pedidos
function mostrarPedidos() {

    //Limpia filas anteriores
    tabla.innerHTML = "";

    pedidos.forEach(function(pedido) {

        if (filtro.value === "todas" || pedido.mesa === Number(filtro.value)) {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${pedido.mesa}</td>
                <td>${pedido.comensal}</td>
                <td>${pedido.productos}</td>
                <td>Bs ${pedido.total}</td>
            `;

            tabla.appendChild(fila);
        }
    });
}

// Cuando se cambia de mesa
filtro.addEventListener("change", mostrarPedidos);

// Mostrar pedidos al abrir la página
mostrarPedidos();
