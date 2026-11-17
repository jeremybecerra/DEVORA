# DEVORA · Backend (API REST)

API de DEVORA para el primer incremento: un comensal entra a su mesa, se identifica, pide del menú y ve su consumo individual; el restaurante consulta los pedidos por mesa.

- **Tecnologías:** Node.js 20+ (probado con 22), Express 5, MySQL 8 (opcional, mediante `mysql2`).
- **Formato:** JSON. Rutas bajo `/api`. Contrato completo con ejemplos en [API.md](API.md).

## Inicio rápido

```bash
cd backend
npm install
npm start
```

Abre `http://localhost:3000/api/salud`. Sin configurar nada arranca con **datos de prueba en memoria** (mesas `01`–`08`, la `08` cerrada; 9 productos, uno agotado).

| Comando | Para qué sirve |
|---|---|
| `npm start` | Inicia el servidor. |
| `npm run start:prod` | Inicia el servidor con un supervisor que lo vuelve a levantar si se cae (para la demostración). |
| `npm run dev` | Inicia y se reinicia solo al guardar cambios. |
| `npm test` | Ejecuta las pruebas automáticas (56 casos). |
| `npm run test:mysql` | Prueba el repositorio MySQL contra una base real (requiere `DATA_SOURCE=mysql`). |

## Configuración

Copia `.env.example` como `.env` y ajusta los valores. El archivo `.env` nunca se sube al repositorio.

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto HTTP. |
| `DATA_SOURCE` | `memory` | `memory` (datos de prueba) o `mysql`. |
| `CORS_ORIGINS` | `*` | Orígenes permitidos, separados por coma. |
| `LOG_REQUESTS` | `true` | Registra cada solicitud en la consola. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | — | Conexión a MySQL (solo con `DATA_SOURCE=mysql`). |
| `FRONTEND_DIR` | `../frontend` | Carpeta del frontend del comensal; si existe, se sirve en `/`. |
| `PANEL_DIR` | `../panel` | Carpeta del panel del restaurante; si existe, se sirve en `/panel/`. |

Si un valor es inválido (por ejemplo `DATA_SOURCE=mysql` sin `DB_USER`), el servidor no arranca y explica qué falta.

### Usar MySQL

1. Crear la base y las tablas con [docs/esquema-mysql.sql](docs/esquema-mysql.sql) (incluye los mismos datos de prueba). Si la base se creó con la versión anterior del esquema, ejecutar además [docs/migraciones/001-version-y-fechas.sql](docs/migraciones/001-version-y-fechas.sql).
2. En `.env`: `DATA_SOURCE=mysql` y los datos `DB_*`.
3. `npm run test:mysql` para comprobar la conexión y el contrato; luego `npm start`.

## Un solo servidor para la demostración

Con la estructura del repositorio:

```
DEVORA/
├── backend/    ← esta API
├── frontend/   ← app del comensal
├── panel/      ← panel del restaurante
└── db/         ← scripts de base de datos
```

`npm start` sirve todo junto: la app del comensal en `http://localhost:3000/?mesa=01` (o `/mesa/01`), el panel en `http://localhost:3000/panel/` y la API en `/api`. Al compartir el mismo origen no hace falta configurar CORS.

## Arquitectura

Arquitectura en capas; cada capa solo conoce a la de abajo:

```
HTTP ─► routes ─► controllers ─► services ─► repositories ─► memoria | MySQL
                                   │
                                 domain (reglas, validaciones, errores, montos)
```

| Carpeta | Responsabilidad |
|---|---|
| `src/routes` | Un archivo de rutas por recurso (`mesas`, `productos`, `comensales`, `pedidos`, `pagos`, `salud`); `index.js` los monta. |
| `src/controllers` | Un controlador por recurso: traduce la solicitud HTTP a una llamada de servicio y la respuesta a JSON. Sin reglas de negocio. |
| `src/services` | Reglas de negocio: mesa abierta, comensal de la mesa, productos disponibles, cálculo de totales, transiciones de estado. `pago.service.js` es el módulo preparado para el siguiente incremento. |
| `src/domain` | Validadores de entrada, reglas configurables, errores con su código HTTP y cálculo de montos en centavos. |
| `src/repositories` | Acceso a datos. `contrato.js` define los métodos; `memory/` y `mysql/` lo implementan. |
| `src/container.js` | Raíz de composición: elige la implementación de datos y conecta los servicios. |
| `src/middlewares` | Seguridad, registro de solicitudes, 404 y manejo central de errores. |

**Patrones aplicados**

- **Repositorio:** los servicios no saben si los datos están en memoria o en MySQL. Para usar otra base basta con otra implementación del contrato (`src/repositories/contrato.js`), que además se verifica al arrancar.
- **Inyección de dependencias:** los servicios reciben sus repositorios y otros servicios por el constructor. Por eso las pruebas usan datos en memoria sin cambiar el código.
- **Fábrica de la aplicación:** `createApp()` arma Express sin abrir puertos; lo usan el servidor y las pruebas.
- **Manejo central de errores:** los servicios lanzan errores del dominio (`ValidationError`, `NotFoundError`, `ConflictError`, `ServiceUnavailableError`) y un solo middleware los convierte en `{ codigo, mensaje, detalles }` con el código HTTP correcto.
- **Control de concurrencia optimista:** cada pedido tiene una `version`. Si dos solicitudes lo modifican al mismo tiempo, la segunda detecta el cambio, vuelve a leer y reintenta; ningún producto agregado se pierde.
- **Módulos por recurso:** para agregar una funcionalidad (por ejemplo pagos) se crean su archivo de rutas, su controlador y su servicio, y se monta con una línea en `routes/index.js`, sin tocar los demás módulos.

## Qué pasa cuando algo falla

| Situación | Qué hace el backend |
|---|---|
| Datos inválidos en una solicitud | Responde 400/404/409 con un mensaje claro; las demás solicitudes no se ven afectadas. |
| Error inesperado en una ruta | Responde 500 sin mostrar detalles internos y lo registra en la consola; el servidor sigue atendiendo. |
| La base de datos no responde | Solo las rutas que la necesitan responden **503** «servicio no disponible»; `/api/salud` informa `degradado`. |
| Error grave fuera de una solicitud | Se registra y el servidor se cierra en orden (termina lo que estaba atendiendo y cierra la base). Con `npm run start:prod` el supervisor lo vuelve a levantar en 1–15 s. |
| Configuración incorrecta | El servidor no arranca y explica qué variable falta o está mal. |

## Reglas de negocio

| Regla | Dónde | Respuesta si no se cumple |
|---|---|---|
| El pedido debe tener al menos un producto (**CA-02**) | `validators.parseItems` | 400 `DATOS_INVALIDOS` |
| Cantidad entera entre 1 y 20 por producto | `validators.parseItems` | 400 |
| Nombre o apodo de 2 a 40 caracteres | `validators.parseNombre` | 400 |
| La mesa existe y está abierta | `MesaService.obtenerAbierta` | 404 / 409 `MESA_CERRADA` |
| El comensal pertenece a esa mesa | `ComensalService.obtenerDeMesa` | 409 `COMENSAL_OTRA_MESA` |
| El producto existe y está disponible | `ProductoService.obtenerDisponibles` | 404 / 409 `PRODUCTO_NO_DISPONIBLE` |
| **Precio y total se calculan con la base de datos**, nunca con lo que envía el celular | `PedidoService` | — |
| Montos en centavos para evitar errores de redondeo | `domain/money.js` | — |
| Un reenvío con la misma `Idempotency-Key` no duplica el pedido (**CA-07**); la clave vale solo para ese comensal | `PedidoService.crear` | 200 con el pedido existente |
| Dos cambios simultáneos al mismo pedido no se pisan | `PedidoService` + `version` | Reintento automático; 409 `CONFLICTO_CONCURRENCIA` si persiste |
| Estados: `recibido → en_preparacion → listo → entregado` (o `cancelado`) | `domain/rules.js` | 409 `TRANSICION_INVALIDA` |
| Pagos y llamada al mesero: fuera del alcance del primer incremento | rutas | 501 `NO_DISPONIBLE` |

## Pruebas

- `npm test` levanta la API en un puerto libre con datos en memoria nuevos para cada caso y prueba las rutas de punta a punta: pedido válido (CA-01), pedido vacío (CA-02), producto agotado, cantidad inválida, mesa cerrada, comensal de otra mesa, precio manipulado, idempotencia (CA-07), ampliar pedido, consulta del panel, cambios de estado y errores de formato.
- `tests/resiliencia.test.js` simula fallas: base de datos caída (503 solo en esa ruta), error inesperado (500 sin detalles internos) y salud degradada.
- `tests/repositorios.contrato.test.js` aplica las mismas pruebas a cualquier implementación de repositorio (memoria siempre; MySQL si está configurado), incluido el control de versión.
- [postman/DEVORA.postman_collection.json](postman/DEVORA.postman_collection.json): colección para probar a mano el caso válido y los inválidos; cada solicitud guarda los ids que necesita la siguiente.
