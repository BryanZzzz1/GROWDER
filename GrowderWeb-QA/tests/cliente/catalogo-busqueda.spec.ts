import { test } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Catalogo y Navegacion - Suite: Busqueda y Seleccion de Productos', () => {

  test('[TC-CAT-001] Debe explorar el catalogo principal, buscar por termino y desplegar detalle del producto', async ({ page, homePage, productDetailPage }) => {
    // Paso 1: Navegar a la tienda principal
    await Navigators.irA(page, Urls.BASE);

    // Paso 2: Capturar vitrina inicial de productos
    await ControlledAction.tomarCaptura(page, '06_catalogo_tienda_inicial');

    // Paso 3: Ejecutar busqueda de productos
    await homePage.buscarProducto('mate');

    // Paso 4: Capturar resultados de busqueda
    await ControlledAction.tomarCaptura(page, '07_catalogo_resultados_busqueda');

    // Paso 5: Seleccionar producto del catalogo por posicion nth
    await homePage.seleccionarProductoPorIndice(0);

    // Paso 6: Validar presencia de opciones de compra en el detalle
    await productDetailPage.comprarAhora();

    // Paso 7: Capturar carro desplegado desde el detalle
    await ControlledAction.tomarCaptura(page, '08_detalle_producto_carro');
  });

});
