import { test, expect } from '../BaseTest';
import { Navigators } from '../../Helpers/Navigators';
import { Urls } from '../../enum/Urls';
import { ControlledAction } from '../../utils/ControlledAction';

test.describe('Modulo: Catalogo y Navegacion - Suite: Busqueda Avanzada y Filtros', () => {

  test('[TC-BUS-001] Debe ordenar los articulos por mayor a menor precio y actualizar el listado', async ({ page, buscarPage }) => {
    // Paso 1: Navegar a la vista de busqueda
    await Navigators.irA(page, Urls.BUSCAR);

    // Paso 2: Capturar estado inicial
    await ControlledAction.tomarCaptura(page, '18_buscar_estado_inicial');

    // Paso 3: Aplicar ordenamiento descendente de precio
    await buscarPage.ordenarPorMayorPrecio();

    // Paso 4: Validar parametro en la URL
    await expect(page).toHaveURL(/orden=precio-desc/);

    // Paso 5: Capturar productos ordenados
    await ControlledAction.tomarCaptura(page, '19_buscar_orden_precio_desc');
  });

  test('[TC-BUS-002] Debe desplegar pantalla de vacio ante busqueda inexistente y permitir restablecer filtros', async ({ page, buscarPage }) => {
    // Paso 1: Navegar a la vista de busqueda
    await Navigators.irA(page, Urls.BUSCAR);

    // Paso 2: Filtrar por termino que no coincide con ningun producto
    await buscarPage.buscarPorTexto('xyz123abc');

    // Paso 3: Validar visualizacion del mensaje de no disponibilidad
    await buscarPage.verificarSinResultadosVisible();
    await ControlledAction.tomarCaptura(page, '20_buscar_sin_resultados');

    // Paso 4: Presionar boton para restablecer filtros
    await buscarPage.restablecerFiltros();

    // Paso 5: Validar que el primer producto vuelva a estar disponible
    const tarjeta = buscarPage.obtenerTarjetaPorIndice(0);
    await ControlledAction.esperarVisibilidad(tarjeta);
    await ControlledAction.tomarCaptura(page, '21_buscar_filtros_restablecidos');
  });

});
