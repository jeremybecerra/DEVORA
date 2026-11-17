import { config } from "../../configuracion/Configuracion.js";
import { RepositorioComensalHttp } from "../repositorios/RepositorioComensalHttp.js";
import { RepositorioComensalSimulado } from "../repositorios/RepositorioComensalSimulado.js";
/** Simple Factory: el modo demo se elige de manera explícita; nunca por error de red. */
export class FabricaRepositorios {
  static crearRepositorioComensal(modoDemostracion = config.demo) {
    return modoDemostracion ? new RepositorioComensalSimulado() : new RepositorioComensalHttp();
  }
}
export function crearApi() { return FabricaRepositorios.crearRepositorioComensal(); }
