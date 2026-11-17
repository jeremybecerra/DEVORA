
import test from "node:test";
import assert from "node:assert/strict";
import { iniciarPanel } from "../js/app.js";

// Simulación de elementos HTML
function elemento(etiqueta = "div") {
    return {
        tagName: etiqueta.toUpperCase(),
        value: "",
        textContent: "",
        children: [],
        eventos: {},

        appendChild(hijo) {
            this.children.push(hijo);
        },

        replaceChildren(...hijos) {
            this.children = hijos;
        },

        addEventListener(evento, callback) {
            this.eventos[evento] = callback;
        }
    };
}

// Preparar un entorno independiente
async function preparar(respuestas) {
    const nombres = [
        "pedidos",
        "filtroMesa",
        "mensaje",
        "estadoMesas",
        "actualizar"
    ];

    const ids = Object.fromEntries(
        nombres.map(id => [id, elemento()])
    );

    ids.filtroMesa.value = "todas";

    const peticiones = [];

    // Simular la API REST
    const fetchSimulado = async (url) => {
        const ruta = new URL(url, "http://localhost:3000");
        const clave = ruta.pathname + ruta.search;

        peticiones.push(clave);

        const resultado = respuestas[clave];

        if (resultado instanceof Error) {
            throw resultado;
        }

        if (!resultado) {
            throw new Error(`Ruta no simulada: ${url}`);
        }

        return {
            ok: resultado.status === undefined
                || resultado.status < 400,
            status: resultado.status || 200,
            json: async () => resultado.datos
        };
    };

    // Inicializar los módulos reales con dependencias simuladas
    await iniciarPanel({
        documento: {
            getElementById: id => ids[id],
            createElement: elemento
        },
        fetcher: fetchSimulado,
        logger: { error() {} }
    });

    return { ids, peticiones };
}

// Datos de prueba
const mesas = {
    datos: [
        { id: "05", nombre: "Mesa 05" },
        { id: "06", nombre: "Mesa 06" }
    ]
};

const pedido = {
    mesaId: "05",
    comensalNombre: "Jeremy",
    detalles: [
        { nombre: "Silpancho", cantidad: 2 }
    ],
    total: 70
};

// PRUEBA 1: obtener mesas
test("carga las mesas desde la API", async () => {
    const h = await preparar({
        "/api/mesas": mesas,
        "/api/pedidos": { datos: [] }
    });

    assert.deepEqual(
        h.ids.filtroMesa.children.map(opcion => opcion.value),
        ["todas", "05", "06"]
    );
});

// PRUEBA 2: mostrar un pedido válido
test("muestra productos y total correctamente", async () => {
    const h = await preparar({
        "/api/mesas": mesas,
        "/api/pedidos": { datos: [pedido] }
    });

    const celdas = h.ids.pedidos.children[0].children
        .map(celda => celda.textContent);

    assert.deepEqual(celdas, [
        "05",
        "Jeremy",
        "Silpancho x2",
        "Bs 70"
    ]);
});

// PRUEBA 3: filtrar por mesa
test("filtra los pedidos de la mesa 05", async () => {
    const h = await preparar({
        "/api/mesas": mesas,
        "/api/pedidos": { datos: [] },
        "/api/pedidos?mesaId=05": { datos: [pedido] }
    });

    h.ids.filtroMesa.value = "05";
    await h.ids.filtroMesa.eventos.change();

    assert.ok(
        h.peticiones.includes("/api/pedidos?mesaId=05")
    );

    assert.equal(h.ids.pedidos.children.length, 1);
});

// PRUEBA 4: lista vacía
test("informa cuando no hay pedidos", async () => {
    const h = await preparar({
        "/api/mesas": mesas,
        "/api/pedidos": { datos: [] }
    });

    assert.equal(
        h.ids.mensaje.textContent,
        "No hay pedidos para mostrar."
    );
});

// PRUEBA 5: error del servidor
test("muestra un mensaje cuando falla la API", async () => {
    const h = await preparar({
        "/api/mesas": mesas,
        "/api/pedidos": { status: 500, datos: {} }
    });

    assert.equal(
        h.ids.mensaje.textContent,
        "No se pudieron cargar los pedidos."
    );
});
