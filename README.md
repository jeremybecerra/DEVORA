
# DEVORA

**Comparte la mesa, no la confusión.**

Sistema de gestión de pedidos individuales para mesas
grupales de restaurantes.

Proyecto de Ingeniería de Software

Universidad Privada Boliviana (UPB).

## 1. Descripción

DEVORA permite que los comensales de una mesa consulten
el menú, registren pedidos y visualicen su consumo
individual.

El restaurante puede consultar los pedidos registrados,
identificar a los comensales y filtrar los pedidos por mesa.

## 2. Funcionalidades del primer incremento

- Identificación de mesas y comensales.
- Consulta del menú de productos.
- Selección de productos y cantidades.
- Registro de pedidos individuales.
- Cálculo del total desde el backend.
- Consulta de pedidos en el panel del restaurante.
- Filtrado de pedidos por mesa.
- Validación de pedidos y prevención de duplicados.
- Almacenamiento persistente mediante MySQL.

## 3. Tecnologías utilizadas

- HTML5.
- CSS3.
- JavaScript.
- ECMAScript Modules (ES Modules).
- Node.js.
- Express.
- MySQL.
- API REST.
- Git y GitHub.
- Node.js Test Runner.

## 4. Arquitectura

El sistema utiliza una arquitectura cliente-servidor
con un backend organizado en capas y componentes
de presentación modularizados.

- Presentación: interfaz del comensal y panel del restaurante.
- Controladores y rutas: recepción de solicitudes HTTP.
- Servicios: reglas de negocio y procesamiento de pedidos.
- Dominio: validaciones, errores y cálculo de montos.
- Repositorios: acceso a datos en memoria o MySQL.

Las interfaces se comunican con el backend mediante
una API REST que intercambia información en formato JSON.

### Arquitectura modular del panel del restaurante

El panel utiliza módulos ECMAScript mediante import y export,
aplicando el principio de separación de responsabilidades.

| Módulo | Responsabilidad |
|---|---|
| config.js | Configuración de la dirección base de la API. |
| api.js | Solicitudes HTTP y validación de respuestas. |
| view.js | Manipulación del DOM y presentación de información. |
| app.js | Coordinación de módulos, eventos e inicialización. |

Esta organización facilita el mantenimiento, la reutilización
y las pruebas automatizadas.

También se aplica inyección de dependencias para sustituir
la comunicación HTTP y el documento HTML durante las pruebas,
sin depender de un servidor o una base de datos real.

## 5. Estructura del repositorio

    DEVORA/
    ├── backend/
    │   ├── docs/
    │   ├── src/
    │   ├── tests/
    │   ├── .env.example
    │   └── package.json
    ├── frontend-comensal/
    │   └── comensal/
    ├── panel-restaurante/
    │   ├── js/
    │   │   ├── api.js
    │   │   ├── app.js
    │   │   ├── config.js
    │   │   └── view.js
    │   ├── test/
    │   │   └── panel.test.mjs
    │   ├── index.html
    │   ├── styles.css
    │   └── package.json
    └── README.md

## 6. Requisitos de instalación

- Git.
- Node.js 22 recomendado (versión probada).
- npm.
- Navegador web.
- MySQL 8 para almacenamiento persistente
  (probado con MySQL 8.4.13).

MySQL no es obligatorio para ejecutar el modo en memoria.

## 7. Instalación y ejecución

Los siguientes comandos están preparados para
PowerShell en Windows.

Clonar el repositorio:

    git clone https://github.com/jeremybecerra/DEVORA.git
    cd DEVORA

Instalar las dependencias:

    cd backend
    npm.cmd ci

Crear el archivo de configuración local:

    Copy-Item .env.example .env

Si el archivo .env ya existe, conservarlo y revisar
su configuración en lugar de sobrescribirlo.

Iniciar el servidor:

    npm.cmd start

La configuración inicial utiliza datos en memoria.
Los pedidos de este modo se pierden al reiniciar
el backend.

## 8. Configuración de MySQL

Para utilizar almacenamiento persistente:

1. Instalar MySQL Server 8.
2. Iniciar el servicio de MySQL.
3. Conectarse como administrador.
4. Ejecutar el esquema SQL del proyecto.

Desde la carpeta backend, ingresar a MySQL:

    mysql --default-character-set=utf8mb4 -u root -p

Si mysql no está disponible en el PATH de Windows,
utilizar la ruta completa de mysql.exe.

Dentro de MySQL, ejecutar:

    SOURCE docs/esquema-mysql.sql;

El script crea la base de datos devora, cinco tablas,
ocho mesas y nueve productos iniciales.

Para una instalación nueva, crear un usuario exclusivo
para el backend:

    CREATE USER 'devora_app'@'127.0.0.1'
    IDENTIFIED BY RANDOM PASSWORD;

    GRANT SELECT, INSERT, UPDATE, DELETE
    ON devora.*
    TO 'devora_app'@'127.0.0.1';

Guardar de forma privada la contraseña generada.
Si el usuario ya existe, no es necesario crearlo nuevamente.

Configurar backend/.env con los siguientes valores:

    DATA_SOURCE=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USER=devora_app
    DB_PASSWORD=
    DB_NAME=devora

Completar DB_PASSWORD con la contraseña local.

Verificar las rutas de las interfaces:

    FRONTEND_DIR=../frontend-comensal/comensal
    PANEL_DIR=../panel-restaurante

Reiniciar el backend para aplicar la configuración.

Consultar /api/salud y comprobar que fuenteDatos
sea mysql y baseDatos sea ok.

## 9. Acceso al sistema

| Componente | Dirección |
|---|---|
| Comensal | http://localhost:3000/?mesa=05 |
| Restaurante | http://localhost:3000/panel/ |
| API REST | http://localhost:3000/api |
| Estado del sistema | http://localhost:3000/api/salud |

Las interfaces deben abrirse mediante el servidor HTTP,
no directamente como archivos HTML locales.

## 10. Pruebas automatizadas

Desde la carpeta backend:

    npm.cmd test

Pruebas de contrato con MySQL:

    npm.cmd run test:mysql

Para ejecutar las pruebas de MySQL es necesario configurar
DATA_SOURCE=mysql y disponer de una base local de pruebas.

Las pruebas de contrato crean registros adicionales.
No deben ejecutarse sobre una base de producción.

Desde frontend-comensal:

    npm.cmd test

Desde panel-restaurante:

    npm.cmd test

Las pruebas del panel verifican:

- Carga de mesas desde la API.
- Visualización de productos y totales.
- Filtrado de pedidos por mesa.
- Manejo de listas vacías.
- Manejo de errores de comunicación con la API.

## 11. Cobertura de código

Desde backend:

    node --experimental-test-coverage --test-coverage-include="src/**/*.js" --test --test-reporter=spec "tests/**/*.test.js"

Desde frontend-comensal:

    node --experimental-test-coverage --test-coverage-include="comensal/js/**/*.js" --test

Desde panel-restaurante:

    npm.cmd run test:coverage

Últimos resultados disponibles por módulo,
obtenidos el 17 de noviembre de 2026:

| Módulo | Pruebas aprobadas | Líneas | Ramas | Funciones |
|---|---:|---:|---:|---:|
| Backend | 58 | 94.97% | 85.46% | 90.16% |
| Comensal | 18 | 73.63% | 62.75% | 59.80% |
| Restaurante | 5 | 96.09% | 90.91% | 90% |
| Total | 81 | - | - | - |

Pruebas fallidas: 0.
Pruebas omitidas: 0.

Los resultados del backend y del comensal corresponden
a la integración anterior. Los resultados del restaurante
corresponden a su refactorización modular.

Se requiere una nueva ejecución conjunta después
de integrar las refactorizaciones del equipo.

Los porcentajes corresponden a los archivos contabilizados
por los reportes de cobertura de cada módulo.
No representan una cobertura global de todo el repositorio.

### Cobertura del panel modularizado

| Archivo | Líneas | Ramas | Funciones |
|---|---:|---:|---:|
| api.js | 95.24% | 90% | 80% |
| app.js | 93.18% | 85.71% | 100% |
| config.js | 100% | 100% | 100% |
| view.js | 97.83% | 93.33% | 91.67% |
| Total | 96.09% | 90.91% | 90% |

### Resultados de la refactorización

| Indicador | Antes | Después |
|---|---:|---:|
| Cobertura de líneas | 92.86% | 96.09% |
| Cobertura de ramas | 76.19% | 90.91% |
| Cobertura de funciones | 100% | 90% |
| Pruebas aprobadas | 5 | 5 |
| Pruebas fallidas | 0 | 0 |

La refactorización conserva los cinco casos de prueba
originales y mejora la separación de responsabilidades.

La cobertura de funciones disminuyó debido a la incorporación
de funciones que todavía no se ejercitan en las pruebas.

## 12. Verificación de integración

Se realizó una prueba manual de extremo a extremo
utilizando MySQL como fuente de datos.

Pedido de prueba:

- Mesa: 05.
- Silpancho: 2 unidades.
- Limonada: 1 unidad.
- Total: Bs 82.

Resultados:

- Registro correcto desde la interfaz del comensal.
- Visualización correcta en el panel del restaurante.
- Almacenamiento del pedido y sus detalles en MySQL.
- Persistencia del pedido después de reiniciar el backend.
- Consistencia entre el total y la suma de subtotales.

La persistencia también puede comprobarse ejecutando
el siguiente script dentro de MySQL, desde backend:

    SOURCE docs/verificacion_persistencia_adriana.sql;

### Criterios de aceptación

| ID | Escenario | Resultado esperado |
|---|---|---|
| CA-01 | Pedido válido | Registro correcto y cálculo del total. |
| CA-02 | Pedido sin productos | Rechazo de la solicitud sin almacenar un pedido vacío. |

Ambos criterios fueron verificados mediante pruebas
del sistema integrado.

### Reproducibilidad

Se verificó la ejecución desde una copia limpia
del repositorio descargada de GitHub.

La instalación utilizó npm ci y el archivo .env.example,
con datos en memoria.

Se registró un pedido de prueba compuesto por un Silpancho
y una Limonada, con un total de Bs 47, visualizado
correctamente en ambas interfaces.

### Verificación posterior a la refactorización

El panel modularizado recuperó correctamente los pedidos
almacenados anteriormente en MySQL, incluyendo el pedido
de Bs 82.

## 13. Seguridad y calidad

- Validación de datos desde el backend.
- Cálculo de precios y totales desde el servidor.
- Prevención de pedidos duplicados mediante idempotencia.
- Control optimista de concurrencia.
- Manejo centralizado de errores.
- Usuario MySQL con permisos limitados.
- Exclusión de credenciales mediante .gitignore.
- Visualización segura de datos mediante textContent.
- Separación de responsabilidades mediante módulos.
- Inyección de dependencias para facilitar las pruebas.
- Pruebas automatizadas y medición de cobertura.

El archivo .env contiene información privada
y nunca debe publicarse en GitHub.

## 14. Limitaciones del primer incremento

- El registro de pagos individuales no está implementado.
- La integración con pasarelas de pago está pendiente.
- El seguimiento de saldos y cierre de mesas está pendiente.
- La llamada al mesero no está implementada en el backend.
- El panel requiere actualizar la consulta para recibir
  los nuevos pedidos mientras permanece abierto.
- No se ha verificado un despliegue en producción.
- HTTPS y los mecanismos completos de autenticación
  y autorización están pendientes.
- Existen archivos y caminos de ejecución pendientes
  de cobertura automatizada.
- No se ha realizado una validación formal de las métricas
  de negocio en restaurantes piloto.

## 15. Equipo de desarrollo

| Integrante | Responsabilidad |
|---|---|
| Alejandra Sejas | Frontend del comensal. |
| Pamela Condori | Backend y API REST. |
| Adriana Montenegro | Base de datos y verificación de persistencia. |
| Jeremy Becerra | Panel del restaurante, modularización, integración, pruebas y documentación técnica. |

## 16. Documentación adicional

- backend/API.md: contrato de la API REST.
- backend/README.md: documentación técnica del backend.
- backend/docs/esquema-mysql.sql: esquema de la base de datos.
- backend/docs/verificacion_persistencia_adriana.sql:
  consultas de verificación.

## Estado del proyecto

Primer incremento funcional, integrado y verificado
en un entorno de desarrollo local.

Actualmente se realizan mejoras de modularidad
y mantenibilidad previas a la entrega definitiva.
