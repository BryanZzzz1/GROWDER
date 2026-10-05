import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicebdService } from '../services/servicesbd.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-pago-exito',
  templateUrl: './pago-exito.page.html',
  styleUrls: ['./pago-exito.page.scss'],
})
export class PagoExitoPage implements OnInit {
  orden: string = '';
  monto: string = '';
  procesando: boolean = true;
  errorPago: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bd: ServicebdService,
    private supabase: SupabaseService
  ) { }

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      const metodo = params['metodo'];

      if (metodo === 'webpay') {
        const token_ws = params['token_ws'];
        await this.confirmarWebpay(token_ws);
      } else {
        this.orden = params['orden'] || 'Desconocida';
        this.monto = params['monto'] || '0';
        await this.registrarCompraExitosa();
      }
    });
  }

  async confirmarWebpay(token_ws: string) {
    try {
      const { data, error } = await this.supabase.client.functions.invoke('confirmar-webpay', {
        body: { token_ws }
      });

      if (error || !data?.exito) throw new Error(error?.message || 'Rechazado');

      this.orden = data.orden;
      this.monto = data.monto;

      await this.registrarCompraExitosa();

    } catch (err) {
      console.error('Error confirmando Webpay:', err);
      this.errorPago = 'El pago no pudo ser confirmado por Transbank.';
      this.procesando = false;
    }
  }

  async registrarCompraExitosa() {
    const session = await this.supabase.client.auth.getSession();
    const userId = session.data.session?.user.id;

    if (userId) {
      try {
        // 1. Descontar Stock y Procesar Compra (RPC)
        const { error: rpcError } = await this.supabase.client.rpc('procesar_compra_y_descontar_stock', {
          p_user_id: userId,
          p_codigo_pedido: this.orden
        });

        if (rpcError) throw new Error(rpcError.message);
        console.log('Stock descontado, historial guardado y carrito vaciado.');

        // 2. Cambiar estado del pedido a 'pagado'
        await this.supabase.client
          .from('pedidos')
          .update({ estado: 'pagado' })
          .eq('codigo_pedido', this.orden);

        // 3. Enviar correo de confirmación
        await this.enviarCorreoDesdeBD();

      } catch (error) {
        console.error('Error procesando el stock y envío:', error);
      }
    }
    this.procesando = false;
  }

  // NUEVO MÉTODO PARA ENVIAR EL CORREO
  async enviarCorreoDesdeBD() {
    try {
      // 1. Obtener la información completa del pedido desde Supabase
      const { data: pedido, error } = await this.supabase.client
        .from('pedidos')
        .select('*')
        .eq('codigo_pedido', this.orden)
        .single();

      if (error || !pedido) {
        console.error('No se encontró el pedido para enviar el correo:', error);
        return;
      }

      // 2. Calcular el IVA matemáticamente (ya que no está en la BD)
      const iva = Math.round(pedido.subtotal * 0.19);

      // 3. Formatear la dirección
      const direccionCompleta = `${pedido.direccion}, ${pedido.depto ? 'Depto ' + pedido.depto + ', ' : ''}${pedido.comuna}, ${pedido.region}`;

      // 4. Armar el payload para la Edge Function
      const datosCorreo = {
        orden_id: pedido.codigo_pedido,
        email_cliente: pedido.email_cliente,
        subtotal: pedido.subtotal,
        iva: iva,
        costo_envio: pedido.costo_envio,
        total: pedido.total,
        items: pedido.items, // JSONB guardado en la BD
        despacho: direccionCompleta
      };

      // 5. Invocar la función
      const { data: emailData, error: emailError } = await this.supabase.client.functions.invoke('enviar-correo', {
        body: datosCorreo
      });

      if (emailError) {
        console.error('[EDGE FUNCTION] Error al enviar correo:', emailError.message);
      } else {
        console.log('[EDGE FUNCTION] Correo enviado exitosamente (PAGO EXITOSO):', emailData);
      }

    } catch (err) {
      console.error('Excepción al preparar el correo:', err);
    }
  }

  volverATienda() {
    this.router.navigate(['/tienda']);
  }
}