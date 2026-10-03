import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';
import { TiempoEspera } from '@/enum/TiempoEspera';

// Pagina para el establecimiento de nueva contrasena
export class ActualizarPasswordPage {
  // Localizadores al inicio de la clase antes del constructor (Regla 5)
  readonly page: Page;
  readonly tituloActualizar: Locator;
  readonly campoNuevaPassword: Locator;
  readonly campoConfirmarPassword: Locator;
  readonly botonActualizar: Locator;
  readonly mensajeDiscrepancia: Locator;
  readonly mensajeErrorServidor: Locator;
  readonly contenedorExito: Locator;
  readonly enlaceIniciarSesionExito: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tituloActualizar = page.locator('h1:has-text("Nueva Contraseña")');
    this.campoNuevaPassword = page.locator('input[placeholder="Minimo 6 caracteres"]');
    this.campoConfirmarPassword = page.locator('input[placeholder="Repite tu contraseña"]');
    this.botonActualizar = page.locator('button:has-text("Actualizar contraseña")');
    this.mensajeDiscrepancia = page.locator('text="Las contraseñas no coinciden. Por favor verificalas."');
    this.mensajeErrorServidor = page.locator('text="New password should be different from the old password."');
    this.contenedorExito = page.locator('text="Contraseña actualizada"');
    this.enlaceIniciarSesionExito = page.locator('a:has-text("Iniciar sesion ahora")');
  }

  // Verificar que la vista de actualizacion este visible
  async verificarVistaVisible() {
    await ControlledAction.esperarVisibilidad(this.tituloActualizar);
  }

  // Ingresar datos de nueva clave en los campos
  async ingresarNuevaPassword(nueva: string, confirmacion: string) {
    await ControlledAction.escribir(this.campoNuevaPassword, nueva);
    await ControlledAction.escribir(this.campoConfirmarPassword, confirmacion);
  }

  // Ejecutar clic en el boton de actualizacion
  async clickActualizar() {
    await ControlledAction.click(this.botonActualizar);
  }

  // Flujo completo para definir y guardar la nueva clave
  async actualizarPassword(nueva: string, confirmacion: string) {
    await this.ingresarNuevaPassword(nueva, confirmacion);
    await this.clickActualizar();
  }

  // Validar presencia del mensaje de contrasenas no coincidentes
  async verificarErrorDiscrepancia() {
    await ControlledAction.esperarVisibilidad(this.mensajeDiscrepancia);
  }

  // Validar presencia del mensaje cuando la clave es igual a la actual
  async verificarErrorMismaPassword() {
    await ControlledAction.esperarVisibilidad(this.mensajeErrorServidor, TiempoEspera.LARGO);
  }

  // Validar confirmacion visual de actualizacion exitosa
  async verificarExito() {
    await ControlledAction.esperarVisibilidad(this.contenedorExito);
  }

  // Redirigir al login desde el enlace de exito
  async irALoginDesdeExito() {
    await ControlledAction.click(this.enlaceIniciarSesionExito);
  }
}
