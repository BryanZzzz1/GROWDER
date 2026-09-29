import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ServicebdService } from '../../services/servicesbd.service';
import { CartService } from '../../services/cart.service';

interface Compra {
  id: number | string;
  idproducto: number;
  foto: string;
  nombre: string;
  precio: number;
  cantidad: number;
  estado?: string;
}

@Component({
  selector: 'app-historial-compras',
  templateUrl: './historial-compras.page.html',
  styleUrls: ['./historial-compras.page.scss'],
})
export class HistorialComprasPage implements OnInit {
  historialCompras: Compra[] = [];
  cargando: boolean = false;

  constructor(
    private bd: ServicebdService,
    private cartService: CartService,
    private router: Router,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
  }

  async ionViewWillEnter() {
    await this.cargarHistorial();
  }

  async cargarHistorial() {
    this.cargando = true;
    try {
      this.historialCompras = await this.cartService.getPurchaseHistory();
      console.log('[Mis Compras] Registros obtenidos:', this.historialCompras);
    } catch (error: any) {
      console.error('[Mis Compras] Error al cargar:', error);
      const toast = await this.toastController.create({
        message: `Error cargando historial: ${error.message || 'Desconocido'}`,
        color: 'danger',
        duration: 3000
      });
      await toast.present();
    } finally {
      this.cargando = false;
      this.cdr.detectChanges(); // Forzar actualización del DOM
    }
  }

  async doRefresh(event: any) {
    await this.cargarHistorial();
    event.target.complete();
  }

  async volverAComprar(idproducto: number) {
    const producto = await this.bd.getProductById(idproducto);
    
    if (!producto || !producto.activo) {
      const toast = await this.toastController.create({
        message: 'Este artículo ya no se encuentra disponible en nuestro catálogo',
        duration: 2500,
        position: 'bottom',
        color: 'dark',
        cssClass: 'app-toast'
      });
      await toast.present();
    } else {
      this.router.navigate(['/dtproducto', idproducto]);
    }
  }

  verDetalle(item: any) {
    // Usar pedido_id, id o codigo_pedido según corresponda al objeto aplanado
    const identificador = item.pedido_id || item.codigo_pedido || item.id;
    this.router.navigate(['/detalle-pedido', identificador]);
  }
}
