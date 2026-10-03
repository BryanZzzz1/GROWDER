import { test } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { CredencialesUsuario, PedidoPrueba } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';
import { MockHelpers } from '../../Helpers/MockHelpers';

test.describe('Modulo: Portal de Cliente - Suite: Seguimiento Logistico y Mis Compras', () => {

  test('[TC-MC-001] Debe mostrar vista sin compras cuando la cuenta no registra pedidos', async ({ page, loginPage, homePage, misComprasPage }) => {
    // Paso 1: Autenticar usuario del cliente
    await MockHelpers.mockLoginEnCheckout(page);
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a mis compras con cuenta limpia
    await Navigators.irA(page, Urls.MIS_COMPRAS);

    // Paso 3: Validar mensaje de compras no registradas
    await misComprasPage.verificarSinComprasVisible();
    await ControlledAction.tomarCaptura(page, '26_mis_compras_sin_pedidos');
  });

  test('[TC-MC-002] Debe consultar el historial de compras y desplegar el detalle con stepper logistico', async ({ page, loginPage, homePage, misComprasPage }) => {
    // Paso 1: Configurar mock de la tabla pedidos de Supabase
    await MockHelpers.mockPedidos(page, [PedidoPrueba]);

    // Paso 2: Autenticar al usuario
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await homePage.verificarSesionIniciada();

    // Paso 3: Navegar al portal de compras
    await Navigators.irA(page, Urls.MIS_COMPRAS);
    await misComprasPage.verificarListadoVisible();
    await ControlledAction.tomarCaptura(page, '27_mis_compras_listado_con_pedidos');

    // Paso 4: Abrir la primera compra disponible por indice
    await misComprasPage.abrirDetalleCompra(0);

    // Paso 5: Validar presencia del stepper logistico
    await misComprasPage.verificarStepperVisible();
    await ControlledAction.tomarCaptura(page, '28_mis_compras_stepper_logistico');

    // Paso 6: Retornar al listado
    await misComprasPage.volverAlListado();
  });

});
