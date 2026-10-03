import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { CredencialesUsuario } from '../../resource/DatosPrueba';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Administracion - Suite: Inventario y Registro de Productos', () => {

  test('[TC-ADM-006] Debe desplegar formulario de creacion de producto y retornar a inventario sin alterar datos', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a la creacion de productos
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAAgregarProducto();

    // Paso 3: Completar formulario con datos de demostracion
    await adminPage.llenarFormularioProducto(
      'Mate Imperial Edicion Especial QA',
      '29990',
      '5',
      'Modelo de prueba automatizada para verificacion de interfaz sin persistencia.'
    );
    await ControlledAction.tomarCaptura(page, '35_admin_agregar_producto_formulario');

    // Paso 4: Cancelar / retornar al inventario garantizando no modificar el catalogo
    await adminPage.volverAInventario();
    const cantidadArticulos = await adminPage.tarjetasProductos.count();
    expect(cantidadArticulos).toBeGreaterThan(0);
    await ControlledAction.tomarCaptura(page, '36_admin_retorno_inventario');
  });

  test('[TC-ADM-007] Debe impedir el guardado cuando los campos obligatorios estan vacios', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar al formulario de nuevo producto
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAAgregarProducto();

    // Paso 3: Intentar enviar formulario vacio pulsando guardar
    await adminPage.clickGuardarProducto();

    // Paso 4: Validar que el campo nombre reporte invalidez HTML5 (required) y no permita el envio
    const nombreValido = await adminPage.campoNombreProducto.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(nombreValido).toBeFalsy();
    expect(await adminPage.tituloAgregarProducto.isVisible()).toBeTruthy();
    await ControlledAction.tomarCaptura(page, '40_admin_producto_validacion_vacio');
  });

  test('[TC-ADM-008] Debe validar limites impidiendo valores de precio o stock negativos', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a la creacion de productos
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAAgregarProducto();

    // Paso 3: Ingresar valores negativos fuera del rango permitido
    await adminPage.llenarFormularioProducto(
      'Producto Invalido QA',
      '-15000',
      '-5',
      'Descripcion para prueba de valores negativos fuera de rango.'
    );

    // Paso 4: Validar que los campos numericos violen el rango minimo (min="0")
    const precioValido = await adminPage.campoPrecio.evaluate((el: HTMLInputElement) => el.checkValidity());
    const stockValido = await adminPage.campoStock.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(precioValido).toBeFalsy();
    expect(stockValido).toBeFalsy();

    // Paso 5: Comprobar que el formulario no se envia y permanece en pantalla
    await adminPage.clickGuardarProducto();
    expect(await adminPage.tituloAgregarProducto.isVisible()).toBeTruthy();
    await ControlledAction.tomarCaptura(page, '41_admin_producto_valores_negativos');
  });

  test('[TC-ADM-011] Debe validar estado vacio en inventario ante busqueda sin coincidencias y restablecer articulos', async ({ page, loginPage, homePage, adminPage }) => {
    // Paso 1: Autenticar sesion de administrador
    await Navigators.irA(page, Urls.LOGIN);
    await loginPage.iniciarSesion(CredencialesUsuario.email, CredencialesUsuario.passwordValida);
    await Navigators.validarUrlActual(page, Urls.BASE);
    await homePage.verificarSesionIniciada();

    // Paso 2: Navegar a la seccion de inventario
    await Navigators.irA(page, Urls.ADMIN);
    await adminPage.irAInventario();

    // Paso 3: Esperar carga inicial de articulos
    const primerArticulo = ControlledAction.obtenerElementoPorIndice(adminPage.tarjetasProductos, 0);
    await ControlledAction.esperarVisibilidad(primerArticulo);

    // Paso 4: Realizar busqueda sin coincidencias y validar estado vacio
    await ControlledAction.escribir(adminPage.buscadorInventario, 'PRODUCTO_NO_REGISTRADO_XYZ');
    await adminPage.verificarEstadoVacioInventario();
    await ControlledAction.tomarCaptura(page, '46_admin_inventario_estado_vacio');

    // Paso 5: Limpiar termino de busqueda y verificar recuperacion de tarjetas
    await adminPage.limpiarBusquedaInventario();
    await ControlledAction.esperarVisibilidad(primerArticulo);
    await ControlledAction.tomarCaptura(page, '47_admin_inventario_busqueda_restablecida');
  });

});
