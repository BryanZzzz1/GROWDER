import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { DatosClientePrueba } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';
import { MockHelpers } from '../../Helpers/MockHelpers';

test.describe('Modulo: Checkout e Inventario - Suite: Reserva y Confirmacion de Pedido', () => {

  test('[TC-CHK-001] Debe mostrar la etapa de despacho y ubicacion al llegar a confirmacion de pago', async ({ page, homePage, productDetailPage, confirmacionPagoPage }) => {
    // Paso 1: Configurar respuesta mockeada para inicio de sesion
    await MockHelpers.mockLoginEnCheckout(page);

    // Paso 2: Navegar a la tiendar
    await Navigators.irA(page, Urls.BASE);

    // Paso 3: Seleccionar el primer producto disponible por posicion
    await homePage.seleccionarProductoPorIndice(0);

    // Paso 4: Agregar producto y abrir el carro
    await productDetailPage.comprarAhora();

    // Paso 5: Proceder al pago desde el carrito
    await productDetailPage.irAPagar();

    // Paso 6: Validar que el cliente este en confirmacion de pago
    await Navigators.validarUrlActual(page, Urls.CONFIRMACION_PAGO);

    // Paso 7: Capturar formulario de confirmacion de pago
    await ControlledAction.tomarCaptura(page, '09_confirmacion_pago_inicial');

    // Paso 8: Iniciar sesion en checkout si solicita identificacion
    await confirmacionPagoPage.iniciarSesionSiEsRequerido(DatosClientePrueba.email, DatosClientePrueba.password);

    // Paso 9: Comprobar que el indicador de despacho y ubicacion este visible
    await confirmacionPagoPage.verificarTimerVisible();

    // Paso 10: Capturar vista con etapa de despacho activa
    await ControlledAction.tomarCaptura(page, '10_banner_reserva_stock_timer');

    // Paso 11: Validar texto del indicador de etapa
    const textoEtapa = await confirmacionPagoPage.obtenerTextoTemporizador();
    expect(textoEtapa.length).toBeGreaterThan(0);
  });

});
