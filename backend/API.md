# Contrato de la API · DEVORA

Base: `http://localhost:3000/api` · Formato: JSON · Codificación: UTF-8

## Formato de errores

Todos los errores responden con el mismo cuerpo. El frontend puede mostrar `mensaje` directamente al usuario.

```json
{
  "codigo": "DATOS_INVALIDOS",
  "mensaje": "Agrega al menos un producto antes de confirmar.",
  "detalles": [{ "campo": "items", "mensaje": "Agrega al menos un producto antes de confirmar." }]
}
```

| HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `DATOS_INVALIDOS`, `JSON_INVALIDO` | Faltan datos, formato incorrecto o fuera de rango. `detalles` indica cada campo. |
| 404 | `NO_ENCONTRADO`, `RUTA_NO_ENCONTRADA` | La mesa, producto, comensal, pedido o ruta no existe. |
| 409 | `MESA_CERRADA`, `PRODUCTO_NO_DISPONIBLE`, `COMENSAL_OTRA_MESA`, `PEDIDO_CERRADO`, `TRANSICION_INVALIDA`, `CANTIDAD_MAXIMA`, `CONFLICTO_CONCURRENCIA` | La solicitud es correcta pero choca con el estado actual. |
| 501 | `NO_DISPONIBLE` | Función prevista para un incremento posterior (pagos, llamar al mesero). |
| 503 | `SERVICIO_NO_DISPONIBLE` | La base de datos no responde. Se puede reintentar en unos segundos; el resto de la API sigue funcionando. |
| 500 | `ERROR_INTERNO` | Error inesperado del servidor (se registra en la consola, sin mostrar detalles internos). |

---

## Salud

### `GET /api/salud`
Comprueba el servidor **y** la base de datos.
```json
{ "estado": "ok", "baseDatos": "ok", "fuenteDatos": "mysql", "hora": "2026-11-16T14:05:00.000Z" }
```
Si la base de datos no responde: `503`
```json
{ "estado": "degradado", "baseDatos": "sin_conexion", "fuenteDatos": "mysql", "hora": "2026-11-16T14:05:00.000Z" }
```

## Mesas

### `GET /api/mesas`
Lista todas las mesas (para el filtro del panel).
```json
[{ "id": "01", "nombre": "Mesa 01", "estado": "abierta" }, { "id": "08", "nombre": "Mesa 08", "estado": "cerrada" }]
```

### `GET /api/mesas/:id`
```json
{ "id": "01", "nombre": "Mesa 01", "estado": "abierta" }
```
`404` si la mesa no existe. El `id` es el código que va en el QR (`?mesa=01`).

### `GET /api/mesas/:id/pedidos`
Igual que `GET /api/pedidos?mesaId=:id`.

## Menú

### `GET /api/productos`
Parámetros opcionales: `categoria=Bebidas`, `disponibles=true` (oculta los agotados).
```json
[
  {
    "id": 1,
    "nombre": "Silpancho",
    "descripcion": "Carne apanada, arroz, papa, huevo y salsa criolla.",
    "categoria": "Platos principales",
    "precio": 35,
    "disponible": true,
    "imagenUrl": "",
    "tiempoEstimado": 15
  }
]
```

## Comensales

### `POST /api/comensales` → `201`
```json
{ "mesaId": "01", "nombre": "Pame" }
```
Respuesta:
```json
{ "id": 1, "mesaId": "01", "nombre": "Pame", "creadoEn": "2026-11-16T14:05:10.000Z" }
```
Errores: `400` nombre de menos de 2 o más de 40 caracteres · `404` mesa inexistente · `409` mesa cerrada.

### `GET /api/comensales/:id`
Devuelve el comensal o `404`.

## Pedidos

### `POST /api/pedidos` → `201`
Encabezado opcional: `Idempotency-Key: <texto único por envío>` (por ejemplo `crypto.randomUUID()`). Si el mismo comensal repite la misma clave, responde `200` con el pedido ya creado y **no lo duplica**. La clave vale solo para ese comensal: otro comensal con la misma clave crea su propio pedido.
```json
{
  "mesaId": "01",
  "comensalId": 1,
  "items": [
    { "productoId": 1, "cantidad": 1 },
    { "productoId": 4, "cantidad": 2 }
  ]
}
```
Respuesta (encabezado `Location: /api/pedidos/1`):
```json
{
  "id": 1,
  "mesaId": "01",
  "comensalId": 1,
  "comensalNombre": "Pame",
  "estado": "recibido",
  "fecha": "2026-11-16T14:06:00.000Z",
  "actualizadoEn": "2026-11-16T14:06:00.000Z",
  "version": 1,
  "detalles": [
    { "productoId": 1, "nombre": "Silpancho", "cantidad": 1, "precio": 35, "subtotal": 35 },
    { "productoId": 4, "nombre": "Salteña de pollo", "cantidad": 2, "precio": 8, "subtotal": 16 }
  ],
  "total": 51
}
```
- Los precios y el total los calcula el servidor con el menú; cualquier precio enviado se ignora.
- Las fechas están en UTC (formato ISO 8601); el frontend las muestra en la hora local.
- `version` sube cada vez que el pedido cambia (control de concurrencia).
- Si un producto aparece dos veces en `items`, se suman las cantidades.

Errores:

| Caso | HTTP | Ejemplo de `mensaje` |
|---|---|---|
| `items` vacío (CA-02) | 400 | Agrega al menos un producto antes de confirmar. |
| Cantidad 0, negativa, decimal o mayor a 20 | 400 | La cantidad debe ser un número entero entre 1 y 20. |
| Producto inexistente | 404 | El producto 999 no existe en el menú. |
| Producto agotado | 409 | «Helado de canela» ya no está disponible. Quítalo de tu pedido o elige otro producto. |
| Mesa cerrada | 409 | La Mesa 08 está cerrada y no recibe pedidos. Pide ayuda al personal. |
| Comensal de otra mesa | 409 | El comensal no pertenece a esta mesa. Vuelve a escanear el QR de tu mesa. |

### `GET /api/pedidos/:id`
Devuelve el pedido (mismo formato) o `404`.

### `GET /api/pedidos`
Para el panel del restaurante. Parámetros opcionales: `mesaId=05`, `estado=recibido`. Ordenados del más reciente al más antiguo; cada pedido trae `comensalNombre`, `detalles` y `total`.

### `POST /api/pedidos/:id/items` → `200`
Agrega productos a un pedido existente; si el producto ya estaba, suma la cantidad y recalcula el total. Si dos solicitudes agregan productos al mismo tiempo, el servidor las aplica una detrás de otra y no se pierde ninguna.
```json
{ "items": [{ "productoId": 5, "cantidad": 1 }] }
```
`409 PEDIDO_CERRADO` si el pedido ya está `listo`, `entregado` o `cancelado`.

### `PATCH /api/pedidos/:id/estado` → `200`
Para el panel del restaurante.
```json
{ "estado": "en_preparacion" }
```
Transiciones permitidas: `recibido → en_preparacion → listo → entregado`; `recibido` o `en_preparacion → cancelado`. Otra transición responde `409 TRANSICION_INVALIDA`.

## Fuera del alcance del primer incremento

Responden `501 NO_DISPONIBLE` con un mensaje para el usuario (antes comprueban que el pedido o la mesa existan; si no, `404`):

- `POST /api/pedidos/:id/pagos`
- `GET /api/pagos/:id`
- `POST /api/mesas/:id/llamadas`

---

## Para el panel del restaurante

Cada pedido trae lo que hoy muestra la tabla del panel:

| Columna del panel | Campo de la API |
|---|---|
| Mesa | `mesaId` |
| Comensal | `comensalNombre` |
| Productos | `detalles` → `"Silpancho x1, Salteña de pollo x2"` |
| Total | `total` |

```js
const respuesta = await fetch('/api/pedidos?mesaId=05');
const pedidos = await respuesta.json();
```
