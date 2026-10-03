import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina para el panel lateral desplegable del carrito de compras
export class CartDrawerPage {
  // Localizadores al inicio antes del constructor (Regla 5)
  readonly page: Page;
  readonly tituloCarrito: Locator;
  readonly botonCerrar: Locator;
  readonly botonQuitar: Locator;
  readonly mensajeVacio: Locator;
  readonly botonIrAPagar: Locator;
  readonly textoSubtotal: Locator;
  readonly textoTotal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tituloCarrito = page.locator('h2:has-text("Tu Carrito")');
    this.botonCerrar = page.locator('button:has-text("✕")');
    this.botonQuitar = page.locator('button:has-text("Quitar")');
    this.mensajeVacio = page.locator('p:has-text("Tu carrito está vacío.")');
    this.botonIrAPagar = page.locator('button:has-text("Ir a Pagar")');
    this.textoSubtotal = page.locator('div:has-text("Subtotal:")');
    this.textoTotal = page.locator('div:has-text("Total a pagar:")');
  }

  // Verificar que el panel lateral del carrito este abierto
  async verificarCarritoAbierto() {
    await ControlledAction.esperarVisibilidad(this.tituloCarrito);
  }

  // Remover el producto presente en el carrito usando nth (Regla 10)
  async quitarProductoPorIndice(indice: number = 0) {
    const boton = ControlledAction.obtenerElementoPorIndice(this.botonQuitar, indice);
    await ControlledAction.click(boton);
  }

  // Comprobar que el carrito figure en estado vacio
  async verificarCarritoVacio() {
    await ControlledAction.esperarVisibilidad(this.mensajeVacio);
  }

  // Cerrar el panel del carrito
  async cerrarCarrito() {
    await ControlledAction.click(this.botonCerrar);
  }

  // Proceder a la confirmacion de pago
  async irAPagar() {
    await ControlledAction.click(this.botonIrAPagar);
  }
}
