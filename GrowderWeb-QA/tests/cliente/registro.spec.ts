import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Autenticacion y Seguridad - Suite: Registro de Clientes', () => {

  test('[TC-REG-001] Debe procesar el registro de cliente y redirigir a inicio de sesion', async ({ page, registroPage }) => {
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const emailPrueba = `qa_${Date.now()}@duocuc.cl`;

    // Paso 1: Navegar a la vista de registro
    await Navigators.irA(page, Urls.REGISTRO);
    await registroPage.verificarVistaVisible();

    // Paso 2: Capturar formulario inicial
    await ControlledAction.tomarCaptura(page, '16_registro_formulario_inicial');

    // Paso 3: Completar formulario y esperar respuesta del servicio de registro
    const respuestaSignup = page.waitForResponse((resp) => resp.url().includes('/auth/v1/signup'));
    await registroPage.registrarUsuario(emailPrueba, 'ClaveSegura123!', '987654321', '2000-01-01');
    await respuestaSignup;

    // Paso 4: Validar redireccion al login tras confirmacion
    await Navigators.validarUrlActual(page, Urls.LOGIN);
    await ControlledAction.tomarCaptura(page, '17_registro_redireccion_login');
  });

  test('[TC-REG-002] Debe permitir navegar a la pantalla de login desde el enlace de cuenta existente', async ({ page, registroPage }) => {
    // Paso 1: Navegar a la vista de registro
    await Navigators.irA(page, Urls.REGISTRO);
    await registroPage.verificarVistaVisible();

    // Paso 2: Presionar enlace a login
    await registroPage.irALogin();

    // Paso 3: Validar redireccion a la vista de login
    await Navigators.validarUrlActual(page, Urls.LOGIN);
  });

});
