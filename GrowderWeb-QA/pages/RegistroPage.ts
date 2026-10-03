import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina para el registro de nuevos usuarios
export class RegistroPage {
  // Localizadores al inicio antes del constructor (Regla 5)
  readonly page: Page;
  readonly tituloRegistro: Locator;
  readonly campoEmail: Locator;
  readonly campoPassword: Locator;
  readonly campoTelefono: Locator;
  readonly campoFechaNacimiento: Locator;
  readonly botonCrearCuenta: Locator;
  readonly enlaceLogin: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tituloRegistro = page.locator('h1:has-text("Crear cuenta")');
    this.campoEmail = page.locator('input[type="email"]');
    this.campoPassword = page.locator('input[type="password"]');
    this.campoTelefono = page.locator('input[placeholder="912345678"]');
    this.campoFechaNacimiento = page.locator('input[type="date"]');
    this.botonCrearCuenta = page.locator('button:has-text("Crear cuenta")');
    this.enlaceLogin = page.locator('a:has-text("Inicia sesión")');
  }

  // Verificar que el formulario de registro este visible
  async verificarVistaVisible() {
    await ControlledAction.esperarVisibilidad(this.tituloRegistro);
  }

  // Completar todos los campos del formulario de registro
  async completarFormulario(email: string, pass: string, telefono: string, fechaNacimiento: string) {
    await ControlledAction.escribir(this.campoEmail, email);
    await ControlledAction.escribir(this.campoPassword, pass);
    await ControlledAction.escribir(this.campoTelefono, telefono);
    await ControlledAction.escribir(this.campoFechaNacimiento, fechaNacimiento);
  }

  // Enviar el formulario de registro
  async enviarRegistro() {
    await ControlledAction.click(this.botonCrearCuenta);
  }

  // Flujo completo para registrar un nuevo usuario
  async registrarUsuario(email: string, pass: string, telefono: string, fechaNacimiento: string) {
    await this.completarFormulario(email, pass, telefono, fechaNacimiento);
    await this.enviarRegistro();
  }

  // Redirigir a la vista de login
  async irALogin() {
    await ControlledAction.click(this.enlaceLogin);
  }
}
