# DEVORA — arquitectura modular del frontend (primer incremento refactorizado)

## Organización

La interfaz visual y su código de presentación se almacenan en `comensal/interfaz/`, separados de las capas de lógica en `comensal/codigo/`.

```text
comensal/
├── index.html
├── interfaz/
│   ├── estilos/estilos.css
│   ├── recursos/ (logo y fotografías)
│   └── vistas/
│       ├── VistaComensal.js (fachada)
│       ├── VistaBase.js
│       ├── VistaAcceso.js
│       ├── VistaMenu.js
│       ├── VistaPedidos.js
│       ├── VistaPagos.js
│       └── UtilidadesVista.js
├── codigo/
│   ├── inicio.js
│   ├── configuracion/Configuracion.js
│   ├── presentacion/controladores/
│   │   ├── AplicacionComensal.js (composición de controladores)
│   │   ├── ControladorSesion.js
│   │   ├── ControladorMenu.js
│   │   ├── ControladorEventos.js
│   │   ├── ControladorPedidos.js
│   │   └── ControladorPagos.js
│   ├── dominio/
│   │   ├── modelos/CarritoCompras.js
│   │   ├── modelos/CalculadoraCuenta.js
│   │   ├── modelos/Validaciones.js
│   │   ├── contratos/IRepositorioComensal.js
│   │   └── estrategias/{IEstrategiaPago,EstrategiaPagoEfectivo,EstrategiaPagoQR}.js
│   └── infraestructura/
│       ├── almacenamiento/AlmacenamientoSesion.js
│       ├── comunicacion/ClienteHttp.js
│       ├── fabricas/{FabricaApi,FabricaEstrategiasPago}.js
│       ├── repositorios/{RepositorioComensalHttp,RepositorioComensalSimulado}.js
│       └── simulacion/ServicioDatosSimulados.js
└── js/ (adaptadores de compatibilidad para pruebas anteriores)
```

## Patrones aplicados

**MVC:** el modelo del carrito/cuenta y las validaciones viven en el dominio; los controladores de navegación, eventos, pedidos y pagos en `codigo/presentacion/controladores`, y las vistas, estilos y recursos en `interfaz`. Los controladores y vistas se organizan como clases pequeñas compuestas desde una fachada para conservar el funcionamiento del frontend.

**Strategy:** `IEstrategiaPago` es el contrato abstracto; `EstrategiaPagoEfectivo` y `EstrategiaPagoQR` definen el texto y comportamiento descriptivo de cada opción. Se usan en `VistaPagos`. Las transacciones reales siguen a cargo del servidor, que aún no se conecta.

**Factory:** `FabricaEstrategiasPago` selecciona la estrategia y `FabricaRepositorios` crea el repositorio simulado o el repositorio HTTP, sin cambios silenciosos de modalidad si falla la red.

**Repository:** `IRepositorioComensal` define la interfaz común; `RepositorioComensalHttp` y `RepositorioComensalSimulado` ofrecen las mismas operaciones al controlador. Ningún archivo frontend accede directamente a MySQL.

**Inyección de dependencias:** repositorios aceptan los clientes/servicios en sus constructores, permitiendo dobles de prueba.

**Nombres:** clases y contratos en español. La letra `I` delante identifica los contratos abstractos (`IEstrategiaPago`, `IRepositorioComensal`). Algunos nombres de métodos internos se mantienen en inglés por compatibilidad con el contrato API existente y con las pruebas; pueden renombrarse cuando se estabilice el contrato del backend Java.

## Ejecutar y probar

1. Instalar Node.js 18 o posterior.
2. Abrir terminal en `frontend-comensal`.
3. Ejecutar `npm start`.
4. Abrir `http://localhost:4173/?mesa=01&demo=1`.
5. Ejecutar `npm test` para ejecutar pruebas de negocio y arquitectura.

`demo=1` usa datos simulados. Sin ese parámetro, se intenta conectar con `/api` y aparecerá un error hasta que exista el backend. Esto es intencional.

## Pendientes de una siguiente refactorización

- Extraer el marcado HTML embebido en métodos de vistas a plantillas/componentes independientes, si el docente solicita que el HTML esté completamente fuera de JavaScript.
- Separar también los métodos de interacción/eventos por acción específica para reducir el tamaño de `ControladorEventos`.
- Transformar los nombres de métodos internos a español mediante una migración con pruebas de extremo a extremo.
- Integrar backend Java/MySQL cuando el equipo defina sus endpoints y formatos definitivos.

**Esta versión refactoriza el frontend, no implementa ni simula un backend real.**
