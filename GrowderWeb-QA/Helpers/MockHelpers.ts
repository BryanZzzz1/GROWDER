import { Page } from '@playwright/test';
import { DatosClientePrueba } from '../resource/DatosPrueba';

// Manejador centralizado para mockear respuestas de APIs
export class MockHelpers {
  // Simular respuesta JSON para un endpoint especifico
  static async mockRespuesta(page: Page, urlPattern: string, status: number, body: any) {
    await page.route(urlPattern, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body)
      });
    });
  }

  // Simular respuesta de la tabla pedidos de Supabase
  static async mockPedidos(page: Page, pedidos: any[]) {
    await page.route('**/rest/v1/pedidos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pedidos)
      });
    });
  }

  static async mockLoginEnCheckout(page: Page) {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-valid-token-qa',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-qa',
          user: {
            id: 'usr-prueba-qa',
            aud: 'authenticated',
            role: 'authenticated',
            email: DatosClientePrueba.email,
            user_metadata: {
              nombre: DatosClientePrueba.nombre,
              telefono: DatosClientePrueba.telefono
            }
          }
        })
      });
    });
  }
}
