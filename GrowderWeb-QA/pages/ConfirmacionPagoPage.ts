import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';

// Pagina de confirmacion de pago, despacho y pasarelas
export class ConfirmacionPagoPage {
  // Localizadores declarados al principio antes del constructor (Regla 5)
  readonly page: Page;
  readonly campoAuthEmail: Locator;
  readonly campoAuthPassword: Locator;
  readonly botonIngresarCheckout: Locator;
  readonly bannerTimerReserva: Locator;
  readonly contadorTiempo: Locator;
  readonly campoNombre: Locator;
  readonly campoTelefono: Locator;
  readonly campoEmail: Locator;
  readonly campoComuna: Locator;
  readonly campoDireccion: Locator;
  readonly opcionWebpay: Locator;
  readonly opcionMercadoPago: Locator;
  readonly botonPagar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.campoAuthEmail = page.locator('input[placeholder="correo@ejemplo.cl"], input[type="email"]');
    this.campoAuthPassword = page.locator('input[placeholder="Tu contraseña"], input[type="password"]');
    this.botonIngresarCheckout = page.locator('button:has-text("Ingresar y Continuar al Pago"), form button[type="submit"]');
    this.bannerTimerReserva = page.locator('h1:has-text("Revisión y Confirmación de Pedido")');
    this.contadorTiempo = page.locator('h1:has-text("Revisión y Confirmación de Pedido")');
    this.campoNombre = page.locator('#campo-nombre, input[placeholder="Ej: Matías González"]');
    this.campoTelefono = page.locator('#campo-telefono, input[placeholder="Ej: 912345678"]');
    this.campoEmail = page.locator('#campo-email, input[placeholder="correo@ejemplo.cl"]');
    this.campoComuna = page.locator('#campo-comuna, input[placeholder="Ej: Providencia"]');
    this.campoDireccion = page.locator('#campo-direccion, input[placeholder="Ej: Av. Providencia 1234"]');
    this.opcionWebpay = page.locator('text=/Webpay Plus/').nth(0);
    this.opcionMercadoPago = page.locator('text=/Mercado Pago/').nth(0);
    this.botonPagar = page.locator('button:has-text("Pagar con")');
  }

  // Iniciar sesion en checkout si aparece la pantalla de identificacion
  async iniciarSesionSiEsRequerido(email: string, contrasena: string) {
    const requiereLogin = await this.campoAuthEmail.isVisible().catch(() => false);
    if (requiereLogin) {
      await ControlledAction.escribir(this.campoAuthEmail, email);
      await ControlledAction.escribir(this.campoAuthPassword, contrasena);
      await ControlledAction.click(this.botonIngresarCheckout);
    }
  }

  // Verificar que el banner del timer o encabezado este visible
  async verificarTimerVisible() {
    await ControlledAction.esperarVisibilidad(this.bannerTimerReserva);
  }

  // Obtener el texto indicador de la etapa actual
  async obtenerTextoTemporizador() {
    return await ControlledAction.obtenerTexto(this.contadorTiempo);
  }

  // Seleccionar la pasarela de pago deseada
  async seleccionarMetodoPago(metodo: 'webpay' | 'mercadopago') {
    if (metodo === 'webpay') {
      await ControlledAction.click(this.opcionWebpay);
    } else {
      await ControlledAction.click(this.opcionMercadoPago);
    }
  }

  // Obtener texto del boton de pago para validar dinamismo
  async obtenerTextoBotonPago() {
    return await ControlledAction.obtenerTexto(this.botonPagar);
  }

  // Completar formulario de despacho
  async completarFormularioDespacho(nombre: string, telefono: string, email: string, comuna: string, direccion: string) {
    await ControlledAction.escribir(this.campoNombre, nombre);
    await ControlledAction.escribir(this.campoTelefono, telefono);
    await ControlledAction.escribir(this.campoEmail, email);
    await ControlledAction.escribir(this.campoComuna, comuna);
    await ControlledAction.escribir(this.campoDireccion, direccion);
  }
}