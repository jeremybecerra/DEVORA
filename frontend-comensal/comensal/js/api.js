/* Compatibilidad temporal con las pruebas anteriores; usar los módulos en español en código nuevo. */
export { ClienteHttp as HttpApi, ErrorComunicacionApi as ApiError } from "../codigo/infraestructura/comunicacion/ClienteHttp.js";
export { crearApi as createApi } from "../codigo/infraestructura/fabricas/FabricaApi.js";
