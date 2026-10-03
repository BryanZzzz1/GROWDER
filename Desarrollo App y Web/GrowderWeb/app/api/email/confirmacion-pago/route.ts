import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/src/lib/supabase'; // <-- Usa tu cliente existente

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Contraseña de aplicación de 16 caracteres
    },
});

export async function POST(req: Request) {
    try {
        const { codigo_pedido } = await req.json();

        if (!codigo_pedido) {
            return NextResponse.json({ error: 'Código de pedido requerido' }, { status: 400 });
        }

        // 1. Obtener la orden confirmada desde Supabase
        const { data: pedido, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('codigo_pedido', codigo_pedido)
            .single();

        if (error || !pedido) {
            return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
        }

        // 2. Cálculos de IVA (19% en Chile) y Subtotales
        const subtotal = Number(pedido.subtotal) || 0;
        const costoEnvio = Number(pedido.costo_envio) || 0;
        const total = Number(pedido.total) || 0;

        // Si los precios ya tienen IVA incluido:
        const neto = Math.round(subtotal / 1.19);
        const iva = subtotal - neto;

        // 3. Filas de productos para la tabla HTML
        const itemsHtml = pedido.items
            .map(
                (item: any) => `
        <tr style="border-bottom: 1px solid rgba(140, 119, 98, 0.2);">
          <td style="padding: 16px 0;">
            <strong style="color: #1A1A1A; font-size: 15px;">${item.nombre}</strong><br>
            <span style="font-size: 13px; color: #57534e;">Cantidad: ${item.cantidad} × $${Number(item.precio).toLocaleString('es-CL')}</span>
          </td>
          <td style="padding: 16px 0; text-align: right; font-weight: 600; color: #1A1A1A;">
            $${(Number(item.precio) * Number(item.cantidad)).toLocaleString('es-CL')}
          </td>
        </tr>`
            )
            .join('');

        // 4. Plantilla de correo estructurada
        const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f3e9; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid rgba(140, 119, 98, 0.2);">
          
          <!-- Top Accent Line -->
          <div style="background-color: #314235; height: 6px; width: 100%;"></div>

          <!-- Header -->
          <div style="padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #314235; font-family: Georgia, serif;">¡Pago Exitoso!</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; color: #8C7762; font-weight: 600; letter-spacing: 0.05em;">Orden #${pedido.codigo_pedido}</p>
          </div>

          <div style="padding: 0 32px 32px 32px; color: #1A1A1A;">
            <p style="font-size: 16px; margin-top: 0; color: #1A1A1A;">Hola <strong>${pedido.nombre_cliente}</strong>,</p>
            <p style="line-height: 1.6; color: #57534e; font-size: 15px;">
              Tu compra ha sido procesada correctamente a través de <strong>${pedido.metodo_pago ? pedido.metodo_pago.toUpperCase() : 'TRANSACCIÓN DIGITAL'}</strong>. Tu pedido ya está registrado y comenzará su preparación.
            </p>

            <!-- Resumen de Productos -->
            <h3 style="border-bottom: 2px solid #f8f3e9; padding-bottom: 8px; margin-top: 32px; font-size: 16px; color: #314235; font-family: Georgia, serif;">Resumen de tu compra</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Desglose de Pago -->
            <div style="background-color: #f8f3e9; padding: 20px; border-radius: 12px; margin-bottom: 32px; border: 1px solid rgba(140, 119, 98, 0.2);">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #57534e;">Neto:</td>
                  <td style="padding: 6px 0; text-align: right; color: #1A1A1A;">$${neto.toLocaleString('es-CL')}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #57534e;">IVA (19%):</td>
                  <td style="padding: 6px 0; text-align: right; color: #1A1A1A;">$${iva.toLocaleString('es-CL')}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #57534e;">Subtotal Productos:</td>
                  <td style="padding: 6px 0; text-align: right; color: #1A1A1A;">$${subtotal.toLocaleString('es-CL')}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(140, 119, 98, 0.2);">
                  <td style="padding: 6px 0 12px 0; color: #57534e;">Costo de Envío:</td>
                  <td style="padding: 6px 0 12px 0; text-align: right; color: #1A1A1A;">$${costoEnvio.toLocaleString('es-CL')}</td>
                </tr>
                <tr>
                  <td style="padding: 16px 0 0 0; font-weight: 700; font-size: 16px; color: #1A1A1A;">Total Pagado:</td>
                  <td style="padding: 16px 0 0 0; text-align: right; font-weight: 700; font-size: 20px; color: #314235;">$${total.toLocaleString('es-CL')}</td>
                </tr>
              </table>
            </div>

            <!-- Información de Envío -->
            <h3 style="border-bottom: 2px solid #f8f3e9; padding-bottom: 8px; margin-top: 24px; font-size: 16px; color: #314235; font-family: Georgia, serif;">Datos de Despacho</h3>
            <div style="font-size: 14px; line-height: 1.6; color: #57534e; background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid rgba(140, 119, 98, 0.2);">
              <p style="margin: 4px 0;"><strong>Destinatario:</strong> ${pedido.nombre_cliente}</p>
              <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${pedido.telefono_cliente}</p>
              <p style="margin: 4px 0;"><strong>Dirección:</strong> ${pedido.direccion} ${pedido.depto ? `, Depto/Of: ${pedido.depto}` : ''}</p>
              <p style="margin: 4px 0;"><strong>Comuna / Región:</strong> ${pedido.comuna}, ${pedido.region}</p>
              ${pedido.instrucciones ? `<p style="margin: 4px 0;"><strong>Instrucciones:</strong> ${pedido.instrucciones}</p>` : ''}
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f8f3e9; padding: 24px; text-align: center; font-size: 13px; color: #8C7762; border-top: 1px solid rgba(140, 119, 98, 0.2);">
            <p style="margin: 0; font-weight: 600; color: #314235; font-size: 16px; font-family: Georgia, serif; margin-bottom: 8px;">SuMateCL</p>
            <p style="margin: 0;">Gracias por tu compra. Te notificaremos cuando tu paquete esté en camino.</p>
          </div>
        </div>
      </div>
    `;

        // 5. Enviar el correo al cliente
        await transporter.sendMail({
            from: `"SuMateCL" <${process.env.SMTP_USER}>`,
            to: pedido.email_cliente,
            subject: `Comprobante de Pago Aprobado - Pedido #${pedido.codigo_pedido}`,
            html: emailHtml,
        });

        return NextResponse.json({ success: true, message: 'Correo de confirmación enviado exitosamente' });
    } catch (err: any) {
        console.error('Error al enviar correo de confirmación:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}