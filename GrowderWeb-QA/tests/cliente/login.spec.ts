import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { CredencialesUsuario } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Autenticacion y Seguridad - Suite: Inicio de Sesion de Clientes', () => {

  test('[TC-AUTH-001] Debe autenticarse correctamente con las credenciales validas del usuario', async ({ page, loginPage, homePage }) => {
    // Paso 1: Navegar a la vista de login
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.verificarFormularioVisible();

    // Paso 2: Capturar estado inicial del formulario
    await ControlledAction.tomarCaptura(page, '01_login_formulario_inicial');

    // Paso 3: Ingresar credenciales confirmadas
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);

    // Paso 4: Validar redireccion al catalogo y presencia de sesion
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 5: Capturar comprobante de sesion iniciada exitosamente
    await ControlledAction.tomarCaptura(page, '02_login_autenticado_exitoso');
  });

  test('[TC-AUTH-002] Debe detectar y alertar ante intento de ingreso con credencial incorrecta', async ({ page, loginPage }) => {
    let mensajeAlerta = '';
    page.on('dialog', async (dialog) => {
      mensajeAlerta = dialog.message();
      await dialog.accept();
    });

    // Paso 1: Navegar a la vista de login
    await Navigators.irA(page, Urls.LOGIN);

    // Paso 2: Probar credencial incorrecta (hola123) y esperar respuesta del servidor
    const respuestaAuth = page.waitForResponse((resp) => resp.url().includes('/auth/v1/token'));
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordInvalida);
    await respuestaAuth;

    // Paso 3: Capturar estado tras intento fallido
    await ControlledAction.tomarCaptura(page, '03_login_credencial_invalida');

    // Paso 4: Validar mensaje retornado por el servicio de autenticacion
    expect(mensajeAlerta.length).toBeGreaterThan(0);
  });

});
