import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { CredencialesUsuario } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Portal de Cliente - Suite: Mi Cuenta y Sesion', () => {

  test('[TC-CTA-001] Debe consultar los datos de la cuenta y modificar el telefono de contacto', async ({ page, loginPage, homePage, cuentaPage }) => {
    const telefonoNuevo = '912345678';
    const telefonoOriginal = '964258451';

    // Paso 1: Iniciar sesion y esperar establecimiento de sesion
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a la vista de perfil
    await Navigators.irA(page, Urls.CUENTA);
    await cuentaPage.verificarVistaVisible();

    // Paso 3: Capturar perfil antes de modificar
    await ControlledAction.tomarCaptura(page, '13_cuenta_perfil_inicial');

    // Paso 4: Modificar telefono y guardar cambios
    await cuentaPage.clickModificar();
    await cuentaPage.modificarTelefono(telefonoNuevo);
    await cuentaPage.guardarCambios();

    // Paso 5: Capturar comprobante de telefono modificado
    await ControlledAction.tomarCaptura(page, '14_cuenta_telefono_modificado');

    // Paso 6: Restaurar telefono inicial
    await cuentaPage.clickModificar();
    await cuentaPage.modificarTelefono(telefonoOriginal);
    await cuentaPage.guardarCambios();
  });

  test('[TC-CTA-002] Debe cerrar la sesion del cliente y retornar a la vista publica', async ({ page, loginPage, homePage, cuentaPage }) => {
    // Paso 1: Iniciar sesion y esperar establecimiento de sesion
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a la cuenta
    await Navigators.irA(page, Urls.CUENTA);
    await cuentaPage.verificarVistaVisible();

    // Paso 3: Ejecutar cierre de sesion
    await cuentaPage.cerrarSesion();

    // Paso 4: Validar retorno al catalogo y ausencia de sesion
    await Navigators.validarUrlActual(page, Urls.BASE);
    await ControlledAction.esperarVisibilidad(homePage.enlaceLogin);
    await ControlledAction.tomarCaptura(page, '15_cuenta_logout_exitoso');
  });

});
