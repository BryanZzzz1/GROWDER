import { NextResponse } from 'next/server';
import { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';
import { supabase } from '@/src/lib/supabase';

// Función para obtener la URL pública real (Vital cuando usas Ngrok)
function obtenerDominioReal(request: Request) {
  const headers = request.headers;
  const host = headers.get('x-forwarded-host') || headers.get('host');
  const proto = headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

async function procesarRetornoTransbank(request: Request) {
  const origin = obtenerDominioReal(request);
  const url = new URL(request.url);
  
  let token_ws = url.searchParams.get('token_ws');
  let TBK_TOKEN = url.searchParams.get('TBK_TOKEN');
  
  if (request.method === 'POST') {
    try {
      const bodyText = await request.text();
      const params = new URLSearchParams(bodyText);
      if (params.get('token_ws')) token_ws = params.get('token_ws');
      if (params.get('TBK_TOKEN')) TBK_TOKEN = params.get('TBK_TOKEN');
    } catch (e) {
      console.warn("No se pudo leer el body del POST");
    }
  }

  // Rutas actualizadas a tu estructura original (/pago/...)
  if (TBK_TOKEN && !token_ws) {
    return NextResponse.redirect(`${origin}/pago/fracaso?motivo=cancelado`);
  }

  if (!token_ws) {
    return NextResponse.redirect(`${origin}/pago/fracaso?motivo=sin_token`);
  }

  try {
    const tx = new WebpayPlus.Transaction(
      new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration)
    );
    
    const commitResponse = await tx.commit(token_ws);

    if (commitResponse.status === 'AUTHORIZED') {
      
      await supabase
        .from('pedidos')
        .update({ estado: 'pendiente', updated_at: new Date().toISOString() })
        .eq('codigo_pedido', commitResponse.buy_order);
      
      try {
        await fetch('http://127.0.0.1:3000/api/reserva/completar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigoReserva: commitResponse.buy_order }),
        });
      } catch (error) {
        console.error('Error al ejecutar el descuento de stock interno:', error);
      }

      // Redirección a la carpeta anidada
      return NextResponse.redirect(`${origin}/pago/exito?orden=${commitResponse.buy_order}&monto=${commitResponse.amount}&token_ws=${token_ws}`);
    
    } else {
      return NextResponse.redirect(`${origin}/pago/fracaso?motivo=rechazado`);
    }
  } catch (error) {
    console.error("Error al confirmar pago con Transbank:", error);
    return NextResponse.redirect(`${origin}/pago/fracaso?motivo=error_confirmacion`);
  }
}

export async function GET(request: Request) {
  return procesarRetornoTransbank(request);
}

export async function POST(request: Request) {
  return procesarRetornoTransbank(request);
}