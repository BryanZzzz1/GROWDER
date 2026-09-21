import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Productos } from '../../services/productos';
import { ServicebdService } from '../../services/servicesbd.service';

@Component({
  selector: 'app-tienda',
  templateUrl: './tienda.page.html',
  styleUrls: ['./tienda.page.scss'],
})
export class TiendaPage implements OnInit {
  arregloProductos: Productos[] = []; // Arreglo para almacenar los productos
  isAdmin: boolean = false; // Propiedad para verificar si el usuario es admin
  isLoggedIn = false;

  constructor(
    private bd: ServicebdService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Inicialmente cargar productos activos
    this.cargarProductos();
    
    // Verificar el estado de administración
    this.bd.getAdminStatus().subscribe((status) => {
      this.isAdmin = status; // Actualizar el estado de isAdmin
    });
    this.bd.isUserLoggedIn.subscribe(status => this.isLoggedIn = status);
  }

  // Cuando la vista está a punto de entrar, recargamos los productos
  ionViewWillEnter() {
    console.log('Cargando productos cuando la vista vuelve a entrar');
    this.cargarProductos(); // Recargar productos activos
  }

  private cargarProductos() {
    this.bd.fetchProductos().then((data) => {
      // Filtrar los productos activos (solo productos con 'activo' == true)
      this.arregloProductos = data.filter((producto) => producto.activo);
    }).catch((e) => {
      console.error('Error al cargar productos:', e);
    });
  }

  // Método que recarga los productos activos
  recargarProductos() {
    this.bd.fetchProductos().then((data) => {
      this.arregloProductos = data.filter((producto) => producto.activo);
    }).catch((e) => {
      console.error('Error al recargar productos:', e);
    });
  }

  // Método que activa el producto y recarga la tienda
  async activarProducto(idproducto: number) {
    try {
      await this.bd.activarProducto(idproducto); // Activar el producto en la base de datos
      // Recargar productos activos después de activar el producto
      this.recargarProductos();
      this.presentToast('Producto activado correctamente');
    } catch (e) {
      console.error('Error al activar el producto:', e);
      this.presentToast('Hubo un error al activar el producto');
    }
  }

  irCarrito() {
    this.router.navigate(['/carro']); // Navegar a la página del carrito
  }

  irAyuda() {
    this.router.navigate(['/ayuda']);
  }

  irPerfil() {
    this.router.navigate([this.isLoggedIn ? '/user-profile' : '/login']);
  }

  async agregarAlCarrito(producto: Productos) {
    const currentUser = await this.bd.getCurrentUser(); // Obtener el usuario actual
    if (currentUser) {
      await this.bd.agregarAlCarrito(producto, currentUser.username); // Agregar producto al carrito con el usuario
    } else {
      const toast = await this.toastController.create({
        message: 'Inicia sesión para guardar productos en tu carrito.',
        duration: 4000,
        position: 'bottom',
        icon: 'person-outline',
        buttons: [{ text: 'Ingresar', handler: () => this.router.navigate(['/login']) }]
      });
      await toast.present();
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

  // Método para navegar a la administración solo si es admin
  irAdministracion() {
    if (this.isAdmin) {
      this.router.navigate(['/administracion']); // Navegar a la página de administración
    } else {
      this.presentToast('No tienes permisos para acceder a la administración');
    }
  }

  irIniciopagina() {
    this.router.navigate(['/iniciotienda']);
  }

  verDetalles(idproducto: number) {
    this.router.navigate(['/dtproducto', idproducto]); // Navegar a la página de detalles del producto
  }
}
