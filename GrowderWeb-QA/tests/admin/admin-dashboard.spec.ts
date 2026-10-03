import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { CredencialesUsuario } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Administracion - Suite: Dashboard y Navegacion', () => {

  test('[TC-ADM-001] Debe autenticar como administrador, validar panel general y alternar entre pestanas', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar usuario con credenciales de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a la vista de administracion
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.verificarPanelVisible();
    await ControlledAction.tomarCaptura(page, '29_admin_dashboard_general');

    // Paso 3: Validar presencia de metricas de resumen (KPIs)
    const cantidadKpis = await adminPage.metricasKpi.count();
    expect(cantidadKpis).toBeGreaterThanOrEqual(3);

    // Paso 4: Alternar entre cada una de las pestanas del panel
    await adminPage.irAAgregarProducto();
    await adminPage.irAGestionRoles();
    await adminPage.irAGestionPedidos();
    await adminPage.irAInventario();
    await ControlledAction.tomarCaptura(page, '30_admin_navegacion_pestanas');
  });

});
