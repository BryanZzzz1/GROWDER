import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina de recuperacion de contrasena por correo
export class RecuperarPasswordPage {
  // Localizadores al inicio de la clase antes del constructor (Regla 5)
  readonly page: Page;
  readonly tituloRecuperar: Locator;
  readonly campoEmail: Locator;
  readonly botonEnviarEnlace: Locator;
  readonly mensajeConfirmacion: Locator;
  readonly enlaceVolverLogin: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tituloRecuperar = page.locator('h1:has-text("Recuperar")');
    this.campoEmail = page.locator('input[type="email"]');
    this.botonEnviarEnlace = page.locator('button:has-text("Enviar enlace de recuperacion"), button[type="submit"]');
    this.mensajeConfirmacion = page.locator('p:has-text("Correo enviado")');
    this.enlaceVolverLogin = page.locator('a[href="/login"]');
  }

  // Verificar que el formulario de recuperacion este desplegado
  async verificarVistaVisible() {
    await ControlledAction.esperarVisibilidad(this.tituloRecuperar);
  }

  // Solicitar envio de enlace de restablecimiento
  async solicitarRestablecimiento(email: string) {
    await ControlledAction.escribir(this.campoEmail, email);
    await ControlledAction.click(this.botonEnviarEnlace);
  }

  // Comprobar mensaje de correo enviado
  async verificarMensajeExito() {
    await ControlledAction.esperarVisibilidad(this.mensajeConfirmacion);
  }

  // Volver a la vista de login
  async volverAlLogin() {
    await ControlledAction.click(this.enlaceVolverLogin);
  }
}
