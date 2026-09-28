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
    // Asegúrate de importar SupabaseService en el constructor si no lo tienes
    const session = await this.supabase.client.auth.getSession();
    const userId = session.data.session?.user.id;

    if (userId) {
      try {
        // Ejecutamos la transacción irrompible en BD
        const { error } = await this.supabase.client.rpc('procesar_compra_y_descontar_stock', {
           p_user_id: userId,
           p_codigo_pedido: this.orden // Ej: SM-491058
        });

        if (error) throw new Error(error.message);
        
        console.log('Stock descontado, historial guardado y carrito vaciado.');
      } catch (error) {
        console.error('Error procesando el stock:', error);
      }
    }
    this.procesando = false;
  }