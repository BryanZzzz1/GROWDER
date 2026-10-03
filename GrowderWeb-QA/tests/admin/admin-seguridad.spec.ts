import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Administracion - Suite: Seguridad y Control de Acceso (RBAC)', () => {

  test('[TC-SEC-001] Debe bloquear acceso a /admin para usuarios no autenticados y redirigir al login', async ({ page, loginPage }) => {
    // Paso 1: Intentar navegar directamente a la URL de administracion sin sesion activa
    await Navigators.irA(page, Urls.ADMIN);

    // Paso 2: Validar que el guard de seguridad redirija al login
    await Navigators.validarUrlActual(page, Urls.LOGIN);
    await loginPage.verificarFormularioVisible();
    await ControlledAction.tomarCaptura(page, '37_seguridad_redireccion_login_sin_auth');
  });

  test('[TC-SEC-002] Debe bloquear el panel de administracion en vista movil desplegando advertencia de uso en escritorio', async ({ page, adminPage }) => {
    // Paso 1: Emular dispositivo movil mediante viewport de pantalla reducida
    await page.setViewportSize({ width: 390, height: 844 });

    // Paso 2: Navegar al modulo de administracion
    await Navigators.irA(page, Urls.ADMIN);

    // Paso 3: Validar que se despliegue la pantalla de bloqueo responsive exclusivo para escritorio
    await adminPage.verificarBloqueoMovil();
    await ControlledAction.esperarVisibilidad(adminPage.enlaceVolverTiendaMovil);
    await ControlledAction.tomarCaptura(page, '38_seguridad_bloqueo_movil');
  });

  test('[TC-SEC-003] Debe restringir la exposicion del enlace de administracion en navegacion publica del cliente', async ({ page, homePage }) => {
    // Paso 1: Navegar a la tienda publica como cliente anonimo
    await Navigators.irA(page, Urls.BASE);

    // Paso 2: Validar que el enlace hacia el panel de administracion no este visible para usuarios publicos
    const enlaceAdmin = page.locator('a[href="/admin"]');
    const esVisible = await enlaceAdmin.isVisible();
    expect(esVisible).toBeFalsy();
    await ControlledAction.tomarCaptura(page, '39_seguridad_cliente_sin_enlace_admin');
  });

});
