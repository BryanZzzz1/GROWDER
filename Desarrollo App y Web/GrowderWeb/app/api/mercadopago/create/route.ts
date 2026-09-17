import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN || '' 
    });
    
    const preference = new Preference(client);

    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    const response = await preference.create({
      body: {
        items: [
          {
            id: body.buyOrder,
            title: 'Compra en SuMateCL',
            quantity: 1,
            unit_price: Number(body.amount),
          }
        ],
        back_urls: {
          success: `${baseUrl}/pago/exito?orden=${body.buyOrder}&monto=${body.amount}`,
          failure: `${baseUrl}/pago/fracaso?motivo=rechazado`,
          pending: `${baseUrl}/pago/fracaso?motivo=pendiente`
        },
        auto_return: 'approved',
      }
    });

    return NextResponse.json({ url: response.init_point });

  } catch (error) {
    console.error('Error al crear preferencia MP:', error);
    return NextResponse.json({ error: 'Error al conectar con Mercado Pago' }, { status: 500 });
  }
}