import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina del portal de cliente y seguimiento de compras
export class MisComprasPage {
  // Localizadores al inicio de la clase (Regla 5)
  readonly page: Page;
  readonly tituloMisCompras: Locator;
  readonly tarjetasCompras: Locator;
  readonly botonesVerDetalle: Locator;
  readonly stepperSeguimiento: Locator;
  readonly botonVolverListado: Locator;
  readonly mensajeSinCompras: Locator;
  readonly enlaceExplorarCatalogo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tituloMisCompras = page.locator('h1:has-text("Mis Compras")');
    this.tarjetasCompras = page.locator('button:has-text("Ver compra y seguimiento")');
    this.botonesVerDetalle = page.locator('button:has-text("Ver compra y seguimiento")');
    this.stepperSeguimiento = page.locator('h4:has-text("1. Pedido recibido")');
    this.botonVolverListado = page.locator('button:has-text("Volver a Mis compras"), button:has-text("Volver al listado")');
    this.mensajeSinCompras = page.locator('h3:has-text("Aún no tienes compras registradas")');
    this.enlaceExplorarCatalogo = page.locator('a:has-text("Explorar catálogo de mates")');
  }

  // Verificar que el encabezado del listado este visible
  async verificarListadoVisible() {
    await ControlledAction.esperarVisibilidad(this.tituloMisCompras);
  }

  // Comprobar estado cuando no hay compras registradas
  async verificarSinComprasVisible() {
    await ControlledAction.esperarVisibilidad(this.mensajeSinCompras);
  }

  // Abrir el detalle de una compra especifica por indice sin usar first ni last (Regla 10)
  async abrirDetalleCompra(indice: number = 0) {
    const boton = ControlledAction.obtenerElementoPorIndice(this.botonesVerDetalle, indice);
    await ControlledAction.click(boton);
  }

  // Verificar que el stepper vertical de seguimiento este desplegado
  async verificarStepperVisible() {
    await ControlledAction.esperarVisibilidad(this.stepperSeguimiento);
  }

  // Regresar al listado general de compras
  async volverAlListado() {
    await ControlledAction.click(this.botonVolverListado);
  }
}
