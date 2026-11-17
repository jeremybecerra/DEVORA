import { escape, formatearDinero, timeText, label, qrImage } from "./UtilidadesVista.js";

export class VistaBase {

  constructor(root, tableTag) { this.root = root; this.tableTag = tableTag; this.waiterButton = globalThis.document?.querySelector("#call-waiter"); }

  setTable(table) {
    this.tableTag.hidden = !table;
    this.tableTag.textContent = table?.nombre || "";
    if (this.waiterButton) this.waiterButton.hidden = !table;
  }

  render(html, focus = false) {
    globalThis.document?.body?.classList.remove("sheet-open");
    this.root.innerHTML = html;
    if (focus) this.root.focus({ preventScroll: true });
  }

  loading(message) {
    this.render(`<div class="loading" role="status"><span class="spinner" aria-hidden="true"></span><p>${escape(message)}</p></div>`);
  }

  state(title, message, retry = false) {
    this.render(`<section class="center-state panel"><div class="symbol" aria-hidden="true">!</div><h1>${escape(title)}</h1><p>${escape(message)}</p>${retry ? '<button class="btn btn-primary" data-action="retry">Volver a intentar</button>' : ""}</section>`, true);
  }
}
