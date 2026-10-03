import { Page, expect } from '@playwright/test';
import { Urls } from '../enum/Urls';

// Control centralizado de navegacion entre vistas
export class Navigators {
  // Navegar a una ruta definida en el enum Urls
  static async irA(page: Page, ruta: Urls) {
    await page.goto(ruta);
  }

  // Validar que la URL actual coincida con la ruta esperada
  static async validarUrlActual(page: Page, rutaEsperada: Urls) {
    if (rutaEsperada === Urls.BASE) {
      await expect(page).toHaveURL(/(:\d+)?\/$/);
    } else {
      await expect(page).toHaveURL(new RegExp(rutaEsperada));
    }
  }
}
