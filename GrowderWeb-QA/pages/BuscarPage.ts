import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina de busqueda avanzada y filtros de productos
export class BuscarPage {
  // Localizadores al inicio antes del constructor (Regla 5)
  readonly page: Page;
  readonly campoBusquedaLateral: Locator;
  readonly botonOrdenMayorMenor: Locator;
  readonly botonOrdenMenorMayor: Locator;
  readonly botonCategoriaMates: Locator;
  readonly tarjetasProductos: Locator;
  readonly mensajeSinResultados: Locator;
  readonly botonRestablecerFiltros: Locator;

  constructor(page: Page) {
    this.page = page;
    this.campoBusquedaLateral = page.locator('input[placeholder="Buscar mates, bombillas..."]');
    this.botonOrdenMayorMenor = page.locator('button:has-text("Mayor a menor precio")');
    this.botonOrdenMenorMayor = page.locator('button:has-text("Menor a mayor precio")');
    this.botonCategoriaMates = page.locator('button:has-text("Mates")').nth(0);
    this.tarjetasProductos = page.locator('article');
    this.mensajeSinResultados = page.locator('h3:has-text("No se encontraron productos")');
    this.botonRestablecerFiltros = page.locator('button:has-text("Restablecer todos los filtros")');
  }

  // Filtrar catalogo escribiendo un termino en el panel lateral
  async buscarPorTexto(termino: string) {
    await ControlledAction.escribir(this.campoBusquedaLateral, termino);
  }

  // Ordenar productos de mayor a menor precio
  async ordenarPorMayorPrecio() {
    await ControlledAction.click(this.botonOrdenMayorMenor);
  }

  // Ordenar productos de menor a mayor precio
  async ordenarPorMenorPrecio() {
    await ControlledAction.click(this.botonOrdenMenorMayor);
  }

  // Comprobar visualmente la advertencia de busqueda sin resultados
  async verificarSinResultadosVisible() {
    await ControlledAction.esperarVisibilidad(this.mensajeSinResultados);
  }

  // Restablecer los filtros aplicados
  async restablecerFiltros() {
    await ControlledAction.click(this.botonRestablecerFiltros);
  }

  // Obtener una tarjeta de producto por indice con nth (Regla 10)
  obtenerTarjetaPorIndice(indice: number): Locator {
    return ControlledAction.obtenerElementoPorIndice(this.tarjetasProductos, indice);
  }
}
