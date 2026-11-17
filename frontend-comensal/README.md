# DEVORA · frontend del comensal

Primer incremento funcional del recorrido del comensal. Usa HTML, CSS y JavaScript modular, sin dependencias de ejecución. El panel del restaurante pertenece a Jeremy y no se incluye aquí porque su repositorio aún no pudo consultarse desde este entorno.

## Ejecutar

Con Node.js disponible, desde esta carpeta:

```sh
npm start
```

Si PowerShell bloquea `npm.ps1`, usar `npm.cmd start` y `npm.cmd test`.

Abrir `http://localhost:4173/?mesa=01&demo=1` para una demostración local. También sirve `/mesa/01?demo=1`. La mesa `02` está cerrada en el modo de prueba y la `99` no existe. El modo de prueba usa datos del archivo `comensal/js/demo.js` y **no registra pedidos en un servidor**. Para el modo normal, quitar `demo=1` y conectar la API. El servidor local devuelve 503 para `/api/*` mientras no exista backend; nunca cambia solo a datos ficticios.

Al abrir el enlace de una mesa disponible, el comensal llega directamente al formulario de nombre con el saludo y número de mesa. Si ya tiene un pedido activo en esa sesión, se recupera su estado para que no lo pierda al recargar.

## Ver en un celular

Conecta el celular y la computadora a la misma red Wi-Fi. Desde esta carpeta ejecuta `npm run mobile` (o `npm.cmd run mobile` si PowerShell bloquea `npm.ps1`). Este comando abre DEVORA en el puerto `4174` y muestra en la terminal las direcciones de red. Abre desde el teléfono la dirección de **Wi-Fi**, por ejemplo `http://192.168.100.179:4174/?mesa=01&demo=1` para la mesa 01; esa IP puede cambiar al reconectarse a la red. La dirección `localhost` del teléfono apunta al propio teléfono, no a la computadora.

Si no carga, confirma que el comando sigue abierto, que ambos dispositivos usan la misma Wi-Fi y que el firewall de Windows permite a Node.js recibir conexiones en la red privada. Algunas redes de invitados aíslan los dispositivos; en ese caso usa otra red o un punto de acceso. Para el QR físico de cada mesa, codifica el enlace de esa mesa en una dirección accesible desde el celular. En producción debe ser una URL HTTPS estable, no una IP local temporal.

## Compartir la demostración por internet

El archivo `DEVORA-demo-publicar.zip` contiene el sitio estático con `index.html` en la raíz y rutas ZIP con `/`, compatibles con Netlify. Súbelo a [Netlify Drop](https://app.netlify.com/drop) para crear un sitio nuevo. Para actualizar el sitio `devorap`, abre ese proyecto en Netlify y sube el ZIP en **Production deploys**; no uses Netlify Drop otra vez porque crearía otro sitio. Comparte la URL con `/?mesa=01&demo=1` al final; también funciona `/mesa/01?demo=1` gracias a `comensal/_redirects`. La persona que lo abra no necesita estar en tu Wi-Fi. Si cambias archivos del frontend, regenera el ZIP con `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build-demo-zip.ps1` desde esta carpeta y publica esa versión.

Esta publicación solo sirve para mostrar el flujo con datos de prueba. Cada visitante tiene su propia sesión en el navegador; los pedidos, llamadas al mesero y pagos no se registran en un servidor. Para usar DEVORA en un restaurante hace falta desplegar el backend y configurar su URL en `comensal/js/config.js` o mediante `window.DEVORA_API_BASE_URL`.

El servidor de desarrollo devuelve `index.html` para `/mesa/:id`. En producción hay que configurar la misma reescritura de rutas o usar `/?mesa=:id` en el QR.

## Estructura

- `comensal/index.html`: estructura accesible y carga de módulos.
- `comensal/css/styles.css`: estilos móvil primero y variables de la marca.
- `comensal/assets/logo.svg`: marca vectorial.
- `comensal/assets/productos/`: fotos ilustrativas optimizadas para la demostración; deben sustituirse por fotos reales del restaurante cuando estén disponibles.
- `comensal/js/app.js`: controlador del flujo y validaciones.
- `comensal/js/view.js`: presentación de pantallas y estados.
- `comensal/js/cart.js`: clase de carrito y totales informativos.
- `comensal/js/checkout.js`: método de pago, propina opcional y cálculo local en centavos.
- `comensal/js/model.js`: lectura y validación de datos de la API.
- `comensal/js/api.js`: adaptador HTTP y selección explícita de la estrategia de demostración.
- `comensal/js/config.js`: URL base y rutas provisionales en un solo lugar.
- `comensal/js/demo.js`: datos y respuestas de prueba aislados.

La separación aplica **Adapter** para el contrato HTTP y **Strategy** para elegir entre API real y demo. `GuestApp`, `Cart`, `View` y `HttpApi` encapsulan estado y comportamiento con POO. Los nombres son cortos y describen la responsabilidad de cada módulo.

En el menú, las categorías se muestran como pestañas superiores: solo se ve una categoría a la vez. El carrito conserva los productos elegidos al cambiar de pestaña. La barra inferior abre un resumen desplegable; el pedido confirmado y la selección nueva aparecen allí, sin duplicar el resumen debajo del menú.

Después de **Pedir algo más**, la barra inferior conserva **Pagar mi consumo**. Si hay productos nuevos sin confirmar, la interfaz permite volver a elegir o quitar esa selección y pagar únicamente lo ya confirmado. Al cambiar cantidades o abrir y cerrar el resumen se conserva el menú montado; las imágenes no se recrean. El servidor local también conserva las fotos en caché durante una hora.

Cada producto abre una vista de detalle con foto, ingredientes y tiempo aproximado. Los tiempos de la demo se generan entre 5 y 20 minutos y se conservan durante la sesión; **son datos de muestra**, no una promesa de preparación. El campo de indicaciones especiales está desactivado hasta que exista un contrato de personalización. El botón superior **Llamar al mesero** envía una solicitud a la API; en demo solo simula el aviso y lo indica claramente.

## Contrato provisional de API

El dossier y el plan de trabajo no fijan endpoints ni JSON. Pamela debe confirmar o cambiar las rutas en `comensal/js/config.js` y el mapeo en `comensal/js/api.js`. URL base por defecto: `/api`. Para apuntar a otro servidor, definir `window.DEVORA_API_BASE_URL` antes de cargar `app.js` (por ejemplo, `http://localhost:3000/api`). Si usa otro origen, el backend debe permitir CORS.

| Operación | Ruta provisional | Respuesta esperada |
| --- | --- | --- |
| Consultar mesa | `GET /api/mesas/:id` | `{ "id": "01", "nombre": "Mesa 01", "estado": "abierta" }` o 404 |
| Menú | `GET /api/productos` | Arreglo de `{ "id": 1, "nombre": "Plato", "descripcion": "...", "categoria": "Platos", "precio": 25, "disponible": true, "imagenUrl": "https://...", "ingredientes": ["..."], "tiempoEstimado": 12 }` |
| Llamar al mesero | `POST /api/mesas/:id/llamadas` | Solicitud `{ "comensalId": 7 }` o `null` antes de identificarse; respuesta de éxito que confirme el aviso |
| Identificar comensal | `POST /api/comensales` | Solicitud `{ "mesaId": "01", "nombre": "Alejandra" }`; respuesta `{ "id": 7, "nombre": "Alejandra" }` |
| Registrar pedido | `POST /api/pedidos` | Solicitud `{ "mesaId": "01", "comensalId": 7, "items": [{ "productoId": 1, "cantidad": 2 }] }` |
| Añadir al mismo pedido | `POST /api/pedidos/:id/items` | Solicitud `{ "items": [{ "productoId": 4, "cantidad": 1 }] }`; respuesta con el **pedido completo y total acumulado** |
| Consultar estado | `GET /api/pedidos/:id` | Mismo formato de respuesta del pedido |
| Solicitar cobro | `POST /api/pedidos/:id/pagos` | Solicitud `{ "metodo": "efectivo" ó "qr", "propina": 5.5 }`; respuesta con el pago |
| Consultar pago | `GET /api/pagos/:id` | Mismo formato de respuesta del pago, con estado actualizado |

Respuesta de pedido: `{ "id": 31, "estado": "recibido", "fecha": "2026-11-15T20:30:00Z", "total": 50, "detalles": [{ "productoId": 1, "nombre": "Plato", "cantidad": 2, "precio": 25, "subtotal": 50 }] }`. `id`, `total` y `detalles` son obligatorios; `fecha` es opcional. Los precios y totales del carrito son solo informativos; el envío incluye únicamente identificadores y cantidades y el comprobante usa exclusivamente los importes devueltos por el backend. Los errores pueden devolver `{ "mensaje": "..." }` con código HTTP apropiado.

`imagenUrl`, `ingredientes` y `tiempoEstimado` son campos opcionales del menú provisional. Si faltan, la interfaz muestra “Foto por confirmar”, la descripción disponible y “Tiempo por confirmar”, sin inventar datos en modo normal. Para un pedido real, el backend debe hacer que los pedidos y añadidos lleguen a cocina o al panel correspondiente.

Respuesta de pago provisional: `{ "id": 12, "orderId": 31, "metodo": "qr", "estado": "pendiente_pago", "propina": 5.5, "totalPagar": 55.5, "qrUrl": "https://..." }`. Para efectivo, el backend debe generar el aviso al mesero y responder `pendiente_cobro`; para QR, debe entregar un QR bancario válido en `qrUrl` y confirmar el pago mediante `GET /api/pagos/:id`. La interfaz solo cierra la sesión si recibe `estado: "pagado"`. La propina se puede dejar en cero y el total final siempre lo define el backend. El frontend no genera un QR de cobro ni marca un pago como realizado por sí mismo. Pamela debe definir la seguridad, idempotencia y persistencia de estas operaciones.

En `?demo=1`, efectivo y QR quedan claramente marcados como simulación. La demo no avisa de verdad al mesero ni genera un QR bancario. En efectivo, después de solicitar el cobro se muestra **El mesero va en camino** y, tras 20 segundos, se simula la confirmación y aparece la despedida sin ningún botón de confirmación para el cliente. La espera continúa tras recargar la página. En QR tampoco aparece un botón de confirmación: después de 10 segundos se simula la confirmación automática, incluso si la página fue recargada. El modo normal nunca confirma un cobro en efectivo automáticamente y no cambia a la demo cuando falla la API.

## Demostrar criterios

- **CA-01, recorrido visual:** abrir `/?mesa=01&demo=1`, escribir un apodo, agregar un producto, tocar **Ver mi pedido** y confirmar. En el comprobante, tocar **Pedir algo más**, agregar otro producto y confirmar: permanece el mismo identificador y aumenta el total. Para demostrar el registro **real**, configurar el backend de Pamela, quitar `demo=1` y verificar los POST y la persistencia.
- **Detalle y mesero:** desde el menú, tocar la foto o el nombre de un plato para ver sus ingredientes, tiempo y foto ampliada. El campo de indicaciones aparece desactivado. Tocar **Llamar al mesero** en el encabezado y comprobar el mensaje de simulación; en modo normal verificar el POST con Pamela.
- **CA-02:** abrir la misma mesa, identificarse y tocar **Ver mi pedido** sin elegir productos. El botón de confirmar está desactivado y el resumen explica por qué. Al eliminar todos los productos, vuelve a desactivarse. No se envía POST.
- **Cambio de idea:** confirmar un pedido, tocar **Pedir algo más** y luego **Pagar mi consumo** sin añadir nada. Si ya elegiste un producto nuevo, el sistema pregunta si prefieres seguir eligiendo o quitar esa selección y pagar solo el pedido confirmado.
- **Pago de prueba:** en el comprobante, tocar **Pagar mi consumo**, elegir efectivo, dejar la propina vacía o escribir un monto y comprobar que el total cambia. Tocar **Solicitar cobro en efectivo**: debe verse que el mesero va en camino y no debe aparecer un botón de confirmación. Después de 20 segundos debe aparecer la despedida y limpiarse la sesión de esa mesa. En QR, esperar 10 segundos para llegar automáticamente a la despedida, sin botón de confirmación.

Ejecutar `npm test` para verificar el carrito, los añadidos, la propina y la forma del envío. La integración real con backend sigue pendiente del contrato de Pamela y de la disponibilidad del repositorio del equipo.
