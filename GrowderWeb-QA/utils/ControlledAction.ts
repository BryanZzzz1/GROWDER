import { Locator, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { TiempoEspera } from '../enum/TiempoEspera';

// Funciones reutilizables para acciones controladas en elementos del DOM
export class ControlledAction {
  // Clic controlado esperando que el elemento este visible y habilitado (sin force)
  static async click(locator: Locator) {
    await locator.waitFor({ state: 'visible', timeout: TiempoEspera.MEDIO });
    await locator.click();
  }

  // Escritura controlada esperando visibilidad
  static async escribir(locator: Locator, texto: string) {
    await locator.waitFor({ state: 'visible', timeout: TiempoEspera.MEDIO });
    await locator.fill(texto);
  }

  // Obtencion de elemento por posicion usando nth sin ocupar first ni last
  static obtenerElementoPorIndice(locator: Locator, indice: number): Locator {
    return locator.nth(indice);
  }

  // Espera asincrona controlada para comprobar si un elemento es visible
  static async esperarVisibilidad(locator: Locator, tiempoMs: number = TiempoEspera.MEDIO) {
    await locator.waitFor({ state: 'visible', timeout: tiempoMs });
  }

  // Obtencion de texto controlado
  static async obtenerTexto(locator: Locator) {
    await locator.waitFor({ state: 'visible', timeout: TiempoEspera.MEDIO });
    return await locator.innerText();
  }

  // Captura de pantalla controlada guardada en la carpeta 'flujos captura'
  static async tomarCaptura(page: Page, nombreCaptura: string) {
    const rutaCarpeta = path.resolve(__dirname, '..', 'flujos captura');
    if (!fs.existsSync(rutaCarpeta)) {
      fs.mkdirSync(rutaCarpeta, { recursive: true });
    }
    const nombreNormalizado = nombreCaptura.replace(/[^a-zA-Z0-9_-]/g, '_');
    const rutaArchivo = path.join(rutaCarpeta, `${nombreNormalizado}.png`);
    await page.screenshot({ path: rutaArchivo, fullPage: false });
  }
}
