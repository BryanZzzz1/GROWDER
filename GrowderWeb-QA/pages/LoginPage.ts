import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina de inicio de sesion
export class LoginPage {
  // Localizadores al inicio de la clase antes del constructor (Regla 5)
  readonly page: Page;
  readonly tituloLogin: Locator;
  readonly campoEmail: Locator;
  readonly campoPassword: Locator;
  readonly botonSubmit: Locator;
  readonly enlaceRecuperarPassword: Locator;
  readonly enlaceRegistro: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tituloLogin = page.locator('h1:has-text("Iniciar sesión")');
    this.campoEmail = page.locator('input[type="email"]');
    this.campoPassword = page.locator('input[type="password"]');
    this.botonSubmit = page.locator('button[type="submit"]');
    this.enlaceRecuperarPassword = page.locator('a[href="/recuperar-password"]');
    this.enlaceRegistro = page.locator('a[href*="/registro"]');
  }

  // Verificar que el formulario de login este visible
  async verificarFormularioVisible() {
    await ControlledAction.esperarVisibilidad(this.tituloLogin);
  }

  // Ingresar credenciales y enviar formulario
  async iniciarSesion(email: string, contrasena: string) {
    await ControlledAction.escribir(this.campoEmail, email);
    await ControlledAction.escribir(this.campoPassword, contrasena);
    await ControlledAction.click(this.botonSubmit);
  }

  // Navegar a recuperacion de clave
  async irARecuperarPassword() {
    await ControlledAction.click(this.enlaceRecuperarPassword);
  }
}
