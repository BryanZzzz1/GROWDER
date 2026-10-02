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
  let TBK_ORDEN_COMPRA = url.searchParams.get('TBK_ORDEN_COMPRA');
  
  if (request.method === 'POST') {
    try {
      const bodyText = await request.text();
      const params = new URLSearchParams(bodyText);
      if (params.get('token_ws')) token_ws = params.get('token_ws');
      if (params.get('TBK_TOKEN')) TBK_TOKEN = params.get('TBK_TOKEN');
      if (params.get('TBK_ORDEN_COMPRA')) TBK_ORDEN_COMPRA = params.get('TBK_ORDEN_COMPRA');
    } catch (e) {
      console.warn("No se pudo leer el body del POST");
    }
  }

  // Rutas actualizadas a tu estructura original (/pago/...)
  if (TBK_TOKEN && !token_ws) {
    if (TBK_ORDEN_COMPRA) {
      await supabase.rpc('cancelar_pedido', {
        p_codigo_pedido: TBK_ORDEN_COMPRA,
        p_motivo: 'cancelado'
      });
    }
    return NextResponse.redirect(`${origin}/pago/fracaso?motivo=cancelado&orden=${TBK_ORDEN_COMPRA || ''}`);
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
      
      const { error } = await supabase.rpc('confirmar_pago_pedido', {
        p_codigo_pedido: commitResponse.buy_order
      });

      if (error) {
        console.error('Error en RPC confirmar_pago_pedido:', error);
      }

      // Redirección a la carpeta anidada
      return NextResponse.redirect(`${origin}/pago/exito?orden=${commitResponse.buy_order}&monto=${commitResponse.amount}&token_ws=${token_ws}`);
    
    } else {
      await supabase.rpc('cancelar_pedido', {
        p_codigo_pedido: commitResponse.buy_order,
        p_motivo: 'rechazado'
      });
      return NextResponse.redirect(`${origin}/pago/fracaso?motivo=rechazado&orden=${commitResponse.buy_order}`);
    }
  } catch (error) {
    console.error("Error al confirmar pago con Transbank:", error);
    // Intentaremos cancelar el pedido si hay algún buy_order en el request
    return NextResponse.redirect(`${origin}/pago/fracaso?motivo=error_confirmacion`);
  }
}

export async function GET(request: Request) {
  return procesarRetornoTransbank(request);
}

export async function POST(request: Request) {
  return procesarRetornoTransbank(request);
}