import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Productos } from '../../services/productos';
import { ServicebdService } from '../../services/servicesbd.service';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-carro',
  templateUrl: './carro.page.html',
  styleUrls: ['./carro.page.scss'],
})
export class CarroPage implements OnInit {
  carrito: Productos[] = [];
  totalPesos: number = 0;
  mostrarPesos: boolean = false;

  // Costo fijo de despacho
  costoDespacho: number = 2650;

  constructor(
    private router: Router,
    private basededatosService: ServicebdService,
    private alertController: AlertController,
    private toastController: ToastController,
    private exchangeRateService: ExchangeRateService
  ) { }

  ngOnInit() {
    this.cargarCarrito();
  }

  ionViewWillEnter() {
    this.cargarCarrito();
  }

  async cargarCarrito() {
    const currentUser = await this.basededatosService.getCurrentUser();
    if (currentUser) {
      this.carrito = await this.basededatosService.obtenerCarrito(currentUser.username);
      this.carrito.forEach(producto => {
        producto.cantidad = producto.cantidad || 1;
      });
      console.log('Carrito cargado desde la nube:', this.carrito);
      this.calcularTotal();
    } else {
      this.carrito = [];
    }
  }

  // ==========================================
  // CÁLCULOS DEL RESUMEN DE ORDEN
  // ==========================================

  get subtotal() {
    return this.carrito.reduce((acc, p) => acc + ((p.precio || 0) * (p.cantidad || 1)), 0);
  }

  get iva() {
    return Math.round(this.subtotal - (this.subtotal / 1.19));
  }

  get subtotalNeto() {
    return this.subtotal - this.iva;
  }

  get totalPagar() {
    return this.subtotal + this.costoDespacho;
  }

  // ==========================================
  // CÁLCULOS DE DIVISAS ORIGINALES
  // ==========================================

  async calcularTotal() {
    const totalDolares = this.subtotal;
    await this.convertirADolares(totalDolares);
  }

  async convertirADolares(totalDolares: number) {
    try {
      const valorDolar = await firstValueFrom(this.exchangeRateService.getDollarValue());
      this.totalPesos = totalDolares * valorDolar;
    } catch (error) {
      console.error('Error al obtener el valor del dólar:', error);
      this.presentToast('No se pudo obtener el valor del dólar.');
    }
  }

  toggleTotal() {
    this.mostrarPesos = !this.mostrarPesos;
  }

  async presentAlert(producto: Productos) {
    const alert = await this.alertController.create({
      header: 'Confirmación',
      message: `¿Desea eliminar ${producto.nombre} del carrito?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Eliminar',
          handler: () => {
            this.eliminarDelCarrito(producto);
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarDelCarrito(producto: Productos) {
    try {
      await this.basededatosService.eliminarDelCarrito(producto.idproducto);
      this.presentToast('Producto eliminado del carrito');
      this.cargarCarrito();
    } catch (error) {
      console.error('Error al eliminar producto del carrito:', error);
      this.presentToast('Error al eliminar producto del carrito');
    }
  }

  async presentToast(msj: string) {
    const toast = await this.toastController.create({
      message: msj,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }

  async irAComprar() {
    const currentUser = await this.basededatosService.getCurrentUser();
    if (currentUser) {
      for (const producto of this.carrito) {
        if (producto.cantidad === undefined || producto.cantidad <= 0) {
          this.presentToast(`La cantidad para ${producto.nombre} no es válida.`);
          return;
        }
      }
      this.router.navigate(['/checkout']);
    } else {
      this.presentToast('Error: Usuario no encontrado');
    }
  }

  async vaciarCarrito() {
    try {
      await this.basededatosService.vaciarCarrito();
      this.presentToast('Carrito vaciado con éxito');
      this.cargarCarrito();
    } catch (error) {
      console.error('Error al vaciar el carrito:', error);
      this.presentToast('Error al vaciar el carrito');
    }
  }

  volverATienda() {
    this.router.navigate(['/tienda']);
  }

  async actualizarCantidad(producto: Productos, nuevaCantidad: number) {
    try {
      await this.basededatosService.actualizarCantidad(producto.idproducto, nuevaCantidad);

      const currentUser = await this.basededatosService.getCurrentUser();
      if (currentUser) {
        this.carrito = await this.basededatosService.obtenerCarrito(currentUser.username);
      }

      this.calcularTotal();
    } catch (e) {
      console.error('Error al actualizar cantidad:', e);
      this.presentToast('Error al actualizar cantidad');
    }
  }

  onImgError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23314235" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="background:%23f8f3e9"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    }
  }
}