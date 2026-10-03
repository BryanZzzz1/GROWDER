import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';
import { TiempoEspera } from '../enum/TiempoEspera';

// Pagina principal de catalogo y navegacion
export class HomePage {
  // Localizadores e iniciadores antes del constructor (Regla 5)
  readonly page: Page;
  readonly barraBusqueda: Locator;
  readonly botonEjecutarBusqueda: Locator;
  readonly botonCarrito: Locator;
  readonly enlacesProductos: Locator;
  readonly enlaceLogin: Locator;
  readonly enlaceMiCuenta: Locator;
  readonly enlaceMisCompras: Locator;

  constructor(page: Page) {
    this.page = page;
    this.barraBusqueda = page.locator('form[role="search"] input, input[placeholder*="Buscar"]');
    this.botonEjecutarBusqueda = page.locator('button[aria-label="Ejecutar busqueda"]');
    this.botonCarrito = page.locator('button[aria-label="Abrir carrito"]');
    this.enlacesProductos = page.locator('a[href*="/product/"]');
    this.enlaceLogin = page.locator('a[href="/login"]:visible');
    this.enlaceMiCuenta = page.locator('a[href="/cuenta"]:visible');
    this.enlaceMisCompras = page.locator('a[href="/mis-compras"]:visible');
  }

  // Buscar un producto en la barra de navegacion
  async buscarProducto(termino: string) {
    await ControlledAction.escribir(this.barraBusqueda, termino);
    await this.barraBusqueda.press('Enter');
  }

  // Seleccionar producto por indice usando nth en vez de first o last (Regla 10)
  async seleccionarProductoPorIndice(indice: number = 0) {
    const enlace = ControlledAction.obtenerElementoPorIndice(this.enlacesProductos, indice);
    await ControlledAction.esperarVisibilidad(enlace, TiempoEspera.LARGO);
    await ControlledAction.click(enlace);
  }

  // Navegar a la vista de login
  async irALogin() {
    await ControlledAction.click(this.enlaceLogin);
  }

  // Comprobar si el usuario esta autenticado mediante el indicador de sesion
  async verificarSesionIniciada() {
    await ControlledAction.esperarVisibilidad(this.enlaceMisCompras);
  }
}
