import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { TiempoEspera } from '../../enum/TiempoEspera';
import { CredencialesUsuario } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Administracion - Suite: Gestion de Roles y Permisos', () => {

  test('[TC-ADM-002] Debe listar usuarios y filtrar por correo o telefono en gestion de roles', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a gestion de roles
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAGestionRoles();

    // Paso 3: Esperar carga de datos y validar existencia de usuarios en ambas tablas
    const primerUsuario = ControlledAction.obtenerElementoPorIndice(adminPage.filasEquipoTrabajo, 0);
    await ControlledAction.esperarVisibilidad(primerUsuario, TiempoEspera.LARGO);
    const cantidadEquipo = await adminPage.filasEquipoTrabajo.count();
    const cantidadClientes = await adminPage.filasClientes.count();
    expect(cantidadEquipo).toBeGreaterThan(0);
    expect(cantidadClientes).toBeGreaterThan(0);

    // Paso 4: Filtrar usuarios mediante el buscador
    await adminPage.buscarUsuario(CredencialesUsuario.email);
    const primerResultado = ControlledAction.obtenerElementoPorIndice(adminPage.filasEquipoTrabajo, 0);
    const textoFila = await ControlledAction.obtenerTexto(primerResultado);
    expect(textoFila).toContain(CredencialesUsuario.email);
    await ControlledAction.tomarCaptura(page, '31_admin_roles_busqueda');
  });

  test('[TC-ADM-003] Debe verificar disponibilidad de controles de asignacion de rol y estado', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar al modulo de roles
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAGestionRoles();

    // Paso 3: Comprobar selector de roles en la primera fila usando nth (Regla 10)
    const filaObjetivo = ControlledAction.obtenerElementoPorIndice(adminPage.filasEquipoTrabajo, 0);
    const selectorRol = filaObjetivo.locator('select');
    await ControlledAction.esperarVisibilidad(selectorRol);

    // Paso 4: Comprobar boton de estado activo / suspendido
    const botonEstado = filaObjetivo.locator('button');
    await ControlledAction.esperarVisibilidad(botonEstado);
    await ControlledAction.tomarCaptura(page, '32_admin_roles_controles');
  });

  test('[TC-ADM-010] Debe desplegar estado vacio en roles al buscar correo o telefono no registrado', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar al modulo de roles
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAGestionRoles();

    // Paso 3: Esperar carga inicial de usuarios
    const primerUsuario = ControlledAction.obtenerElementoPorIndice(adminPage.filasEquipoTrabajo, 0);
    await ControlledAction.esperarVisibilidad(primerUsuario, TiempoEspera.LARGO);

    // Paso 4: Buscar usuario inexistente y verificar estado vacio
    await adminPage.buscarUsuario('usuario_inexistente_qa@growder.cl');
    await adminPage.verificarEstadoVacioRoles();
    await ControlledAction.tomarCaptura(page, '44_admin_roles_estado_vacio');

    // Paso 5: Limpiar termino de busqueda y verificar recuperacion de filas
    await adminPage.limpiarBusquedaRoles();
    await ControlledAction.esperarVisibilidad(primerUsuario);
    await ControlledAction.tomarCaptura(page, '45_admin_roles_busqueda_restablecida');
  });

});
