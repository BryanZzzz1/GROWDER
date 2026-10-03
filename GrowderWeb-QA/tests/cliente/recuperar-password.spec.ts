import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { CredencialesUsuario } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';
import { MockHelpers } from '../../Helpers/MockHelpers';

test.describe('Modulo: Autenticacion y Seguridad - Suite: Recuperacion y Cambio de Clave', () => {

  test.describe.configure({ mode: 'serial' });
  test('[TC-AUTH-003] Debe procesar la solicitud de recuperacion y confirmar envio de correo', async ({ page, recuperarPasswordPage }) => {
    // Interceptar la solicitud a Supabase Auth para evitar bloqueo por tasa de envio en CI/CD
    await MockHelpers.mockRespuesta(page, '**/auth/v1/recover*', 200, {});

    // Paso 1: Navegar a la vista de recuperar contrasena
    await Navigators.irA(page, Urls.RECUPERAR_PASSWORD);
    await recuperarPasswordPage.verificarVistaVisible();

    // Paso 2: Capturar formulario de recuperacion
    await ControlledAction.tomarCaptura(page, '04_recuperar_password_formulario');

    // Paso 3: Enviar el correo registrado del usuario
    await recuperarPasswordPage.solicitarRestablecimiento(CredencialesUsuario.email);

    // Paso 4: Validar mensaje de envio exitoso a la bandeja
    await recuperarPasswordPage.verificarMensajeExito();

    // Paso 5: Capturar comprobante de notificacion enviada
    await ControlledAction.tomarCaptura(page, '05_recuperar_password_confirmado');
  });

  test('[TC-AUTH-004] Debe advertir en pantalla cuando las contrasenas ingresadas no coinciden', async ({ page, loginPage, homePage, actualizarPasswordPage }) => {
    // Paso 1: Autenticar sesion previa para habilitar la actualizacion
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar al formulario de cambio de clave
    await Navigators.irA(page, Urls.ACTUALIZAR_PASSWORD);
    await actualizarPasswordPage.verificarVistaVisible();

    // Paso 3: Ingresar claves con discrepancia
    await actualizarPasswordPage.actualizarPassword('claveNueva123', 'otraClaveDistinta123');

    // Paso 4: Comprobar visualmente la alerta de no coincidencia
    await actualizarPasswordPage.verificarErrorDiscrepancia();
    await ControlledAction.tomarCaptura(page, '06_actualizar_password_discrepancia');
  });

  test('[TC-AUTH-005] Debe rechazar la actualizacion si la nueva clave es igual a la actual', async ({ page, loginPage, homePage, actualizarPasswordPage }) => {
    // Paso 1: Autenticar sesion del cliente
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a la actualizacion de clave
    await Navigators.irA(page, Urls.ACTUALIZAR_PASSWORD);
    await actualizarPasswordPage.verificarVistaVisible();

    // Paso 3: Probar la misma contrasena activa del usuario
    await actualizarPasswordPage.actualizarPassword(CredencialesUsuario.passwordValida, CredencialesUsuario.passwordValida);

    // Paso 4: Validar mensaje de rechazo emitido por el servicio de autenticacion
    await actualizarPasswordPage.verificarErrorMismaPassword();
    await ControlledAction.tomarCaptura(page, '07_actualizar_password_misma_clave');
  });

  test('[TC-AUTH-006] Debe completar el ciclo E2E de cambio de clave, validar acceso y restaurar clave original', async ({ page, loginPage, homePage, actualizarPasswordPage }) => {
    const claveTemporal = 'chile1234';
    let claveFueModificada = false;

    // Paso 1: Autenticar con clave inicial
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    try {
      // Paso 2: Navegar a la actualizacion y aplicar la nueva clave temporal
      await Navigators.irA(page, Urls.ACTUALIZAR_PASSWORD);
      await actualizarPasswordPage.actualizarPassword(claveTemporal, claveTemporal);
      await actualizarPasswordPage.verificarExito();
      claveFueModificada = true;
      await ControlledAction.tomarCaptura(page, '08_actualizar_password_exito');

      // Paso 3: Limpiar sesion y probar rechazo de la clave anterior
      await page.evaluate(() => localStorage.clear());
      await Navigators.irA(page, Urls.LOGIN);

      const eventoDialogo = page.waitForEvent('dialog');
      await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
      const dialogoRechazo = await eventoDialogo;
      expect(dialogoRechazo.message().length).toBeGreaterThan(0);
      await dialogoRechazo.accept();

      // Paso 4: Iniciar sesion con la clave nueva y esperar token de autenticacion
      const respuestaAuthAprobado = page.waitForResponse((resp) => resp.url().includes('/auth/v1/token'));
      await loginPage.iniciarSesion(CredencialesUsuario.email, claveTemporal);
      await respuestaAuthAprobado;
      await Navigators.validarUrlActual(page, Urls.BASE);
      await homePage.verificarSesionIniciada();
    } finally {
      if (claveFueModificada) {
        // Paso 5: Restaurar clave original de manera garantizada para mantener idempotencia
        await Navigators.irA(page, Urls.LOGIN);
        const respuestaTokenRestauracion = page.waitForResponse((resp) => resp.url().includes('/auth/v1/token')).catch(() => null);
        await loginPage.iniciarSesion(CredencialesUsuario.email, claveTemporal);
        await respuestaTokenRestauracion;
        await Navigators.irA(page, Urls.ACTUALIZAR_PASSWORD);
        await actualizarPasswordPage.actualizarPassword(CredencialesUsuario.passwordValida, CredencialesUsuario.passwordValida);
        await actualizarPasswordPage.verificarExito();
      }
    }
  });

});
