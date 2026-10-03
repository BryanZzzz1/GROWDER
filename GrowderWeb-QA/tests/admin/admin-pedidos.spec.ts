import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { CredencialesUsuario } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';
import { MockHelpers } from '../../Helpers/MockHelpers';

test.describe('Modulo: Administracion - Suite: Gestion de Pedidos y Despachos', () => {

  test('[TC-ADM-004] Debe filtrar y buscar pedidos en el panel de administracion', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a gestion de pedidos
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAGestionPedidos();

    // Paso 3: Alternar filtros rapidos de estado
    await adminPage.filtrarPedidosPorEstado('pendientes');
    await adminPage.filtrarPedidosPorEstado('despacho');
    await adminPage.filtrarPedidosPorEstado('recibidos');
    await adminPage.filtrarPedidosPorEstado('todos');

    // Paso 4: Buscar pedido mediante termino de consulta
    await adminPage.buscarPedido('SM-');
    await ControlledAction.tomarCaptura(page, '33_admin_pedidos_filtros');
  });

  test('[TC-ADM-005] Debe abrir modal de detalle de pedido, validar destinatario y cerrar modal', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar al listado de pedidos
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAGestionPedidos();

    // Paso 3: Abrir detalle del primer pedido mediante nth (Regla 10)
    await adminPage.abrirDetallePedidoPorIndice(0);
    await ControlledAction.esperarVisibilidad(adminPage.seccionDestinatario);
    await ControlledAction.esperarVisibilidad(adminPage.seccionDireccion);
    await ControlledAction.tomarCaptura(page, '34_admin_pedidos_modal_detalle');

    // Paso 4: Cerrar modal y validar regreso al listado
    await adminPage.cerrarModalDetalle();
  });

  test('[TC-ADM-009] Debe validar estado vacio al buscar pedido inexistente y recuperar listado al limpiar busqueda', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a gestion de pedidos
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAGestionPedidos();

    // Paso 3: Buscar un codigo inexistente y verificar mensaje de estado vacio
    await adminPage.buscarPedido('SM-NOEXISTE-99999999');
    await adminPage.verificarEstadoVacioPedidos();
    await ControlledAction.tomarCaptura(page, '42_admin_pedidos_estado_vacio');

    // Paso 4: Limpiar termino de busqueda y verificar recuperacion de filas
    await adminPage.limpiarBusquedaPedidos();
    const primerDetalle = ControlledAction.obtenerElementoPorIndice(adminPage.botonesVerDetalle, 0);
    await ControlledAction.esperarVisibilidad(primerDetalle);
    await ControlledAction.tomarCaptura(page, '43_admin_pedidos_busqueda_restablecida');
  });

  test('[TC-ADM-012] Debe mantener estabilidad y resiliencia de la interfaz ante fallo de red simulado en pedidos', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Interceptar endpoint de pedidos simulando respuesta HTTP 500
    await MockHelpers.mockRespuesta(page, '**/rest/v1/pedidos*', 500, {
      code: '500',
      message: 'Internal Server Error'
    });

    // Paso 3: Navegar al panel de pedidos con fallo de backend activo
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAGestionPedidos();

    // Paso 4: Validar que la interfaz permanezca estable sin bloqueo critico
    await ControlledAction.esperarVisibilidad(adminPage.tituloGestionPedidos);
    await ControlledAction.tomarCaptura(page, '48_admin_pedidos_resiliencia_error500');

    // Paso 5: Validar que el usuario puede seguir alternando a otras secciones
    await adminPage.irAInventario();
    await ControlledAction.esperarVisibilidad(adminPage.tituloInventario);
  });

});
