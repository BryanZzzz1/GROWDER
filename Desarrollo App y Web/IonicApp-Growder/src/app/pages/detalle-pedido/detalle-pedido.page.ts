import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicebdService } from '../../services/servicesbd.service';

import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-detalle-pedido',
  templateUrl: './detalle-pedido.page.html',
  styleUrls: ['./detalle-pedido.page.scss'],
})
export class DetallePedidoPage implements OnInit {
  pedidoId: string = '';
  pedido: any = null;
  estadoIndex: number = 0; // 0 = pendiente, 1 = en despacho, 2 = recibido
  
  constructor(
    private route: ActivatedRoute,
    private bd: ServicebdService,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit() {
    this.pedidoId = this.route.snapshot.paramMap.get('id') || '';
    if (this.pedidoId) {
      this.cargarDetalle();
    }
  }

  async cargarDetalle() {
    if (!this.pedidoId) return;

    try {
      // Buscar en 'pedidos' permitiendo coincidencia por ID numérico o código de texto (SM-XXXX)
      let query = this.supabaseService.client.from('pedidos').select('*');
      
      if (!isNaN(Number(this.pedidoId))) {
        query = query.or(`id.eq.${this.pedidoId},codigo_pedido.eq.${this.pedidoId}`);
      } else {
        query = query.eq('codigo_pedido', this.pedidoId);
      }

      const { data, error } = await query.single();
      if (error) throw error;

      this.pedido = data;

      // Calcular estadoIndex para la línea de progreso visual
      const estadoStr = (this.pedido.estado || '').toLowerCase().trim();
      if (estadoStr === 'recibido' || estadoStr === 'entregado') {
        this.estadoIndex = 2;
      } else if (estadoStr === 'en despacho' || estadoStr === 'en camino') {
        this.estadoIndex = 1;
      } else {
        this.estadoIndex = 0; // pendiente
      }

    } catch (err: any) {
      console.error('[DetallePedido] Error al cargar orden:', err);
      this.pedido = null;
    }
  }
}
