import { NextResponse } from 'next/server';

async function procesarRedireccion(request: Request, esPost: boolean) {
  const { searchParams } = new URL(request.url);
  
  // 1. Buscamos los parámetros en la URL (GET)
  let token_ws = searchParams.get('token_ws');
  let tbk_token = searchParams.get('TBK_TOKEN');
  const status = searchParams.get('status');
  const orden = searchParams.get('orden');
  const monto = searchParams.get('monto');

  // 2. Si es POST, también buscamos en el cuerpo de la petición (Form Data)
  if (esPost) {
    try {
      const bodyText = await request.text();
      const params = new URLSearchParams(bodyText);
      if (params.get('token_ws')) token_ws = params.get('token_ws');
      if (params.get('TBK_TOKEN')) tbk_token = params.get('TBK_TOKEN');
    } catch (e) {
      console.error('Error leyendo body:', e);
    }
  }

  let targetUrl = '';

  // 3. Evaluamos de quién es el pago y construimos el Deep Link
  if (status === 'approved') {
    targetUrl = `suemate://pago/exito?orden=${orden}&monto=${monto}&metodo=mercadopago`;
  } 
  else if (status && status !== 'approved') {
    targetUrl = `suemate://pago/fracaso?motivo=${status}`;
  }
  else if (tbk_token) {
    targetUrl = `suemate://pago/fracaso?motivo=cancelado_webpay`;
  } 
  else if (token_ws) {
    targetUrl = `suemate://pago/exito?token_ws=${token_ws}&metodo=webpay`;
  } 
  else {
    targetUrl = `suemate://pago/fracaso?motivo=sin_parametros`;
  }

  // 4. Plantilla de redirección infalible
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Redirigiendo...</title>
        <meta http-equiv="refresh" content="0;url=${targetUrl}">
        <style>
          body { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #f8f3e9; margin: 0; text-align: center; padding: 20px;}
          .btn { margin-top: 20px; padding: 15px 30px; background: #314235; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h2 { color: #111827; }
        </style>
      </head>
      <body>
        <h2>Volviendo a SuMateCL...</h2>
        <a href="${targetUrl}" class="btn" id="redirectBtn">Volver a la app</a>
        <script>
          setTimeout(() => {
            document.getElementById('redirectBtn').click();
            window.location.href = "${targetUrl}";
          }, 500);
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function GET(request: Request) {
  return procesarRedireccion(request, false);
}

export async function POST(request: Request) {
  return procesarRedireccion(request, true);
}