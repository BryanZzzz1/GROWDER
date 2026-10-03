import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Carrito de Compras - Suite: Gestion y Operaciones del Carro', () => {

  test('[TC-CAR-001] Debe abrir el carrito al anadir producto, permitir removerlo y mostrar estado vacio', async ({ page, homePage, productDetailPage, cartDrawerPage }) => {
    // Paso 1: Navegar a la tienda y seleccionar producto por indice
    await Navigators.irA(page, Urls.BASE);
    await homePage.seleccionarProductoPorIndice(0);

    // Paso 2: Anadir al carrito desde la ficha de detalle
    await productDetailPage.comprarAhora();
    await cartDrawerPage.verificarCarritoAbierto();

    // Paso 3: Capturar estado del carrito con producto
    await ControlledAction.tomarCaptura(page, '22_carrito_con_producto');

    // Paso 4: Quitar el producto usando nth(0)
    await cartDrawerPage.quitarProductoPorIndice(0);

    // Paso 5: Validar mensaje de carrito vacio
    await cartDrawerPage.verificarCarritoVacio();
    await ControlledAction.tomarCaptura(page, '23_carrito_vacio');

    // Paso 6: Cerrar el panel del carrito
    await cartDrawerPage.cerrarCarrito();
  });

});
