import { NextResponse } from 'next/server';
import { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, buyOrder, sessionId, returnUrl } = body;

    // 1. Configurar Transbank en modo INTEGRACIÓN (Pruebas)
    const tx = new WebpayPlus.Transaction(
      new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    );

    // 2. Crear la transacción en Webpay
    const response = await tx.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );

    // 3. Devolver el token y la URL al frontend
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error("Error al crear transacción Webpay:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}