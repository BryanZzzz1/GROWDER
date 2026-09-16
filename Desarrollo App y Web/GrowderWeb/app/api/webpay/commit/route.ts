import { NextResponse } from 'next/server';
import { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_ws = searchParams.get('token_ws');
  const TBK_TOKEN = searchParams.get('TBK_TOKEN');
  const TBK_ORDEN_COMPRA = searchParams.get('TBK_ORDEN_COMPRA');

  // Si el usuario canceló el pago en la pantalla de Webpay
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

    // Confirmar el pago con Transbank
    const commitResponse = await tx.commit(token_ws);

    if (commitResponse.status === 'AUTHORIZED') {
      // PAGO APROBADO: Aquí (en el futuro) actualizarás tu base de datos Supabase
      // marcando el pedido como "Pagado"
      
      return NextResponse.redirect(`${origin}/pago/exito?orden=${commitResponse.buy_order}&monto=${commitResponse.amount}`);
    } else {
      // PAGO RECHAZADO (Sin saldo, tarjeta bloqueada, etc.)
      return NextResponse.redirect(`${origin}/pago/fracaso?motivo=rechazado`);
    }
  } catch (error) {
    console.error("Error al confirmar pago:", error);
    return NextResponse.redirect(`${origin}/pago/fracaso?motivo=error_confirmacion`);
  }
}