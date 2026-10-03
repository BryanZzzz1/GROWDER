import { test as baseTest } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ConfirmacionPagoPage } from '../pages/ConfirmacionPagoPage';
import { MisComprasPage } from '../pages/MisComprasPage';
import { LoginPage } from '../pages/LoginPage';
import { RecuperarPasswordPage } from '../pages/RecuperarPasswordPage';
import { ActualizarPasswordPage } from '../pages/ActualizarPasswordPage';
import { CuentaPage } from '../pages/CuentaPage';
import { RegistroPage } from '../pages/RegistroPage';
import { BuscarPage } from '../pages/BuscarPage';
import { CartDrawerPage } from '../pages/CartDrawerPage';
import { AdminPage } from '../pages/AdminPage';

// Fixture centralizado para inyectar Page Objects en cada prueba (POM)
export const test = baseTest.extend<{
  homePage: HomePage;
  productDetailPage: ProductDetailPage;
  confirmacionPagoPage: ConfirmacionPagoPage;
  misComprasPage: MisComprasPage;
  loginPage: LoginPage;
  recuperarPasswordPage: RecuperarPasswordPage;
  actualizarPasswordPage: ActualizarPasswordPage;
  cuentaPage: CuentaPage;
  registroPage: RegistroPage;
  buscarPage: BuscarPage;
  cartDrawerPage: CartDrawerPage;
  adminPage: AdminPage;
}>({                                                                                                                                                                                                                                                                                              
  homePage: async ({ page }, use) => {
    const home = new HomePage(page);
    await use(home);
  },
  productDetailPage: async ({ page }, use) => {
    const productDetail = new ProductDetailPage(page);
    await use(productDetail);
  },
  confirmacionPagoPage: async ({ page }, use) => {
    const confirmacion = new ConfirmacionPagoPage(page);
    await use(confirmacion);
  },
  misComprasPage: async ({ page }, use) => {
    const compras = new MisComprasPage(page);
    await use(compras);
  },
  loginPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await use(login);
  },
  recuperarPasswordPage: async ({ page }, use) => {
    const recuperar = new RecuperarPasswordPage(page);
    await use(recuperar);
  },
  actualizarPasswordPage: async ({ page }, use) => {
    const actualizar = new ActualizarPasswordPage(page);
    await use(actualizar);
  },
  cuentaPage: async ({ page }, use) => {
    const cuenta = new CuentaPage(page);
    await use(cuenta);
  },
  registroPage: async ({ page }, use) => {
    const registro = new RegistroPage(page);
    await use(registro);
  },
  buscarPage: async ({ page }, use) => {
    const buscar = new BuscarPage(page);
    await use(buscar);
  },
  cartDrawerPage: async ({ page }, use) => {
    const cartDrawer = new CartDrawerPage(page);
    await use(cartDrawer);
  },
  adminPage: async ({ page }, use) => {
    const admin = new AdminPage(page);
    await use(admin);
  }
});

export { expect } from '@playwright/test';