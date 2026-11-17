import { escape, formatearDinero, timeText, label, qrImage } from "./UtilidadesVista.js";

export class VistaAcceso {

  home() {
    this.setTable(null);
    this.render(`<section class="center-state panel"><p class="eyebrow">DEVORA</p><h1>Comparte la mesa, no la confusión.</h1><p>Para comenzar en otra mesa, escanea su código QR con la cámara de tu celular o abre el enlace que te entregue el restaurante.</p><p class="helper">No necesitas activar la cámara dentro de esta página.</p></section>`, true);
  }

  name(table, value = "", error = "", busy = false) {
    this.render(`<section class="access-panel"><p class="eyebrow">Tu mesa está lista · Paso 1 de 3</p><h1>¡Bienvenido a ${escape(table.nombre)}!</h1><p class="lead">Comparte la mesa, no la confusión. Escribe tu nombre o apodo para identificar tu pedido individual.</p>
      <form id="name-form" class="panel" novalidate><div class="field"><label for="guest-name">Nombre o apodo</label><input id="guest-name" name="name" type="text" maxlength="40" minlength="2" autocomplete="nickname" placeholder="Por ejemplo, Alejandra" value="${escape(value)}" aria-describedby="name-help name-error" aria-invalid="${Boolean(error)}" ${busy ? "disabled" : ""}/><p class="helper" id="name-help">Entre 2 y 40 caracteres.</p><p id="name-error" class="error-text" role="alert">${escape(error)}</p></div><button class="btn btn-primary btn-full" type="submit" ${busy ? "disabled" : ""}>${busy ? "Guardando…" : "Continuar al menú"}</button></form>
    </section>`, true);
    if (!busy) this.root.querySelector("#guest-name")?.focus({ preventScroll: true });
  }
}
