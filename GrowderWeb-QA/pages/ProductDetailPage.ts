import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina de detalle del producto
export class ProductDetailPage {
  // Localizadores e iniciadores antes del constructor (Regla 5)
  readonly page: Page;
  readonly botonAnadirAlCarrito: Locator;
  readonly botonComprarAhora: Locator;
  readonly botonIrAPagar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.botonAnadirAlCarrito = page.locator('button:has-text("Añadir al carrito")');
    this.botonComprarAhora = page.locator('button:has-text("Comprar ahora")');
    this.botonIrAPagar = page.locator('button:has-text("Ir a Pagar")');
  }

  // Clic en anadir al carrito
  async anadirAlCarrito() {
    await ControlledAction.click(this.botonAnadirAlCarrito);
  }

  // Clic en comprar ahora para agregar y abrir el carrito
  async comprarAhora() {
    await ControlledAction.click(this.botonComprarAhora);
  }

  // Proceder al pago desde el drawer desplegable
  async irAPagar() {
    await ControlledAction.click(this.botonIrAPagar);
  }
}
