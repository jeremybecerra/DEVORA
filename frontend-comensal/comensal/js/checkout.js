export class Checkout {
  constructor(orderTotal) {
    this.baseCents = Math.round(Number(orderTotal) * 100);
    this.method = null;
    this.tipCents = 0;
    this.tipText = "";
    this.error = "";
  }

  setMethod(method) {
    if (method !== "efectivo" && method !== "qr") return false;
    this.method = method;
    return true;
  }

  setTip(text) {
    this.tipText = text.trim();
    if (this.tipText === "") { this.tipCents = 0; this.error = ""; return true; }
    if (!/^\d+(?:[.,]\d{0,2})?$/.test(this.tipText)) {
      this.error = "Escribe un monto válido, con hasta dos decimales.";
      return false;
    }
    const cents = Math.round(Number(this.tipText.replace(",", ".")) * 100);
    if (!Number.isSafeInteger(cents)) { this.error = "El monto de la propina es demasiado alto."; return false; }
    this.tipCents = cents;
    this.error = "";
    return true;
  }

  tip() { return this.tipCents / 100; }
  total() { return (this.baseCents + this.tipCents) / 100; }
}
