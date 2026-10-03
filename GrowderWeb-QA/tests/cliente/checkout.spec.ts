import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { CredencialesUsuario } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Checkout y Pasarela - Suite: Confirmacion de Pago', () => {

  test('[TC-CHK-002] Debe alternar entre las pasarelas Webpay y Mercado Pago actualizando el boton', async ({ page, homePage, productDetailPage, cartDrawerPage, confirmacionPagoPage }) => {
    // Paso 1: Navegar a la tienda y seleccionar un producto
    await Navigators.irA(page, Urls.BASE);
    await homePage.seleccionarProductoPorIndice(0);

    // Paso 2: Anadir al carrito e ir a confirmacion de pago
    await productDetailPage.comprarAhora();
    await cartDrawerPage.irAPagar();
    await Navigators.validarUrlActual(page, Urls.CONFIRMACION_PAGO);

    // Paso 3: Identificarse en el gatekeeper si no hay sesion previa
    await confirmacionPagoPage.iniciarSesionSiEsRequerido(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await ControlledAction.esperarVisibilidad(confirmacionPagoPage.opcionWebpay);

    // Paso 4: Validar boton de pago inicial con Webpay
    let textoBoton = await confirmacionPagoPage.obtenerTextoBotonPago();
    expect(textoBoton).toContain('Webpay Plus');
    await ControlledAction.tomarCaptura(page, '24_checkout_webpay_seleccionado');

    // Paso 5: Alternar a pasarela Mercado Pago
    await confirmacionPagoPage.seleccionarMetodoPago('mercadopago');
    textoBoton = await confirmacionPagoPage.obtenerTextoBotonPago();
    expect(textoBoton).toContain('Mercado Pago');
    await ControlledAction.tomarCaptura(page, '25_checkout_mercadopago_seleccionado');

    // Paso 6: Retornar a Webpay
    await confirmacionPagoPage.seleccionarMetodoPago('webpay');
    textoBoton = await confirmacionPagoPage.obtenerTextoBotonPago();
    expect(textoBoton).toContain('Webpay Plus');
  });

});
