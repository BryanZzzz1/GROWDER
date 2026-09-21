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

  constructor(
    private router: Router,
    private basededatosService: ServicebdService,
    private alertController: AlertController,
    private toastController: ToastController,
    private exchangeRateService: ExchangeRateService
  ) {}

  ngOnInit() {
    this.cargarCarrito();
  }

  async cargarCarrito() {
    const currentUser = await this.basededatosService.getCurrentUser();
    if (currentUser) {
      this.carrito = await this.basededatosService.obtenerCarrito(currentUser.username);
      this.carrito.forEach(producto => {
        producto.cantidad = producto.cantidad || 1; // Asegúrate de que la cantidad esté definida
      });
      console.log('Carrito cargado:', this.carrito);
      this.calcularTotal();
    } else {
      this.carrito = [];
    }
  }

  
  async calcularTotal() {
    const totalDolares = this.carrito.reduce((acc, producto) => {
      const precio = producto.precio || 0;
      const cantidad = producto.cantidad || 0;
      return acc + (precio * cantidad);
    }, 0);
    
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

  get totalDisplay() {
    const totalDolares = this.carrito.reduce((acc, producto) => {
      const precio = producto.precio || 0;
      const cantidad = producto.cantidad || 0;
      return acc + (precio * cantidad);
    }, 0);
    return this.mostrarPesos ? this.totalPesos : totalDolares;
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
      // Verificamos cantidades válidas antes de avanzar
      for (const producto of this.carrito) {
        if (producto.cantidad === undefined || producto.cantidad <= 0) {
          this.presentToast(`La cantidad para ${producto.nombre} no es válida.`);
          return;
        }
      }
      
      // El salto hacia la nueva vista de pago
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
    
    // Actualiza el carrito para reflejar los cambios
    const currentUser = await this.basededatosService.getCurrentUser();
    if (currentUser) {
      this.carrito = await this.basededatosService.obtenerCarrito(currentUser.username);
    }

    // Recalcula el total
    this.calcularTotal();
  } catch (e) {
    console.error('Error al actualizar cantidad:', e);
    this.presentToast('Error al actualizar cantidad');
  }
}

}
