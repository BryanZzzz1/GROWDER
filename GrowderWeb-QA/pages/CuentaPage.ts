import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina de perfil y configuracion de cuenta del cliente
export class CuentaPage {
  // Localizadores al inicio antes del constructor (Regla 5)
  readonly page: Page;
  readonly encabezadoPerfil: Locator;
  readonly botonCerrarSesion: Locator;
  readonly botonModificar: Locator;
  readonly campoTelefono: Locator;
  readonly campoFechaNacimiento: Locator;
  readonly botonGuardarCambios: Locator;
  readonly botonCancelar: Locator;
  readonly enlaceMisCompras: Locator;

  constructor(page: Page) {
    this.page = page;
    this.encabezadoPerfil = page.locator('h1:has-text("@")');
    this.botonCerrarSesion = page.locator('button:has-text("Cerrar sesión")');
    this.botonModificar = page.locator('button:has-text("Modificar")');
    this.campoTelefono = page.locator('input[placeholder="Ej: 912345678"]');
    this.campoFechaNacimiento = page.locator('input[type="date"]');
    this.botonGuardarCambios = page.locator('button:has-text("Guardar Cambios")');
    this.botonCancelar = page.locator('button:has-text("Cancelar")');
    this.enlaceMisCompras = page.locator('a[href="/mis-compras"]');
  }

  // Verificar que la vista de perfil este visible
  async verificarVistaVisible() {
    await ControlledAction.esperarVisibilidad(this.botonCerrarSesion);
  }

  // Cerrar la sesion activa del cliente
  async cerrarSesion() {
    await ControlledAction.click(this.botonCerrarSesion);
  }

  // Habilitar el modo de edicion de datos
  async clickModificar() {
    await ControlledAction.click(this.botonModificar);
  }

  // Modificar el telefono de contacto
  async modificarTelefono(nuevoTelefono: string) {
    await ControlledAction.escribir(this.campoTelefono, nuevoTelefono);
  }

  // Guardar los cambios realizados
  async guardarCambios() {
    await ControlledAction.click(this.botonGuardarCambios);
  }

  // Cancelar la edicion actual
  async cancelarEdicion() {
    await ControlledAction.click(this.botonCancelar);
  }

  // Navegar a la vista de compras desde el perfil
  async irAMisCompras() {
    await ControlledAction.click(this.enlaceMisCompras);
  }
}
