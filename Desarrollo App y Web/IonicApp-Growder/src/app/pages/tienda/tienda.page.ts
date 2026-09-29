import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, ModalController } from '@ionic/angular';
import { Productos } from '../../services/productos';
import { ServicebdService } from '../../services/servicesbd.service';
import { FiltroModalComponent } from '../../components/filtro-modal/filtro-modal.component';

@Component({
  selector: 'app-tienda',
  templateUrl: './tienda.page.html',
  styleUrls: ['./tienda.page.scss'],
})
export class TiendaPage implements OnInit {
  arregloProductos: Productos[] = [];
  filteredProductos: Productos[] = [];
  categorias: any[] = [];
  categoriaSeleccionada: string = 'Todos';
  searchQuery: string = '';
  
  isLoggedIn = false;
  userName: string = 'Invitado';
  userFoto: string = '';
  
  rangoPrecioMin: number = 0;
  rangoPrecioMax: number = 100000;
  soloStock: boolean = false;

  constructor(
    private bd: ServicebdService,
    private router: Router,
    private toastController: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.cargarDatos();
    this.bd.isUserLoggedIn.subscribe(async status => {
      this.isLoggedIn = status;
      if (status) {
        const user = await this.bd.getCurrentUser();
        if (user) {
          // Si tiene nombre en el metadata, usamos eso, sino la primera parte del email
          if (user.nombre) {
            this.userName = user.nombre.split(' ')[0];
          } else if (user.email) {
            this.userName = user.email.split('@')[0];
          } else if (user.username) {
            this.userName = user.username;
          }
          this.userFoto = user.foto || '';
        }
      } else {
        this.userName = 'Invitado';
        this.userFoto = '';
      }
    });
  }

  ionViewWillEnter() {
    this.cargarDatos();
  }

  private async cargarDatos() {
    try {
      this.categorias = await this.bd.obtenerCategorias();
      const data = await this.bd.fetchProductos();
      this.arregloProductos = data.filter((producto) => producto.activo);
      this.filterProducts();
    } catch (e) {
      console.error('Error al cargar datos en tienda:', e);
    }
  }

  recargarProductos() {
    this.cargarDatos();
  }

  filterProducts() {
    let result = this.arregloProductos;
    
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p => p.nombre.toLowerCase().includes(q));
    }
    
    if (this.categoriaSeleccionada !== 'Todos') {
      result = result.filter(p => p.categoria === this.categoriaSeleccionada || p.categoria_id?.toString() === this.categoriaSeleccionada);
    }

    result = result.filter(p => p.precio >= this.rangoPrecioMin && p.precio <= this.rangoPrecioMax);

    if (this.soloStock) {
      result = result.filter(p => (p.cantidad ?? 0) > 0);
    }
    
    this.filteredProductos = result;
  }
  
  async abrirModalFiltros() {
    const modal = await this.modalCtrl.create({
      component: FiltroModalComponent,
      componentProps: {
        categorias: this.categorias,
        categoriaSeleccionada: this.categoriaSeleccionada
      },
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.6
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.categoriaSeleccionada = data.categoria;
      this.rangoPrecioMin = data.precioMin;
      this.rangoPrecioMax = data.precioMax;
      this.soloStock = data.soloStock;
      this.filterProducts();
    }
  }
  
  seleccionarCategoria(catNombre: string) {
    this.categoriaSeleccionada = catNombre;
    this.filterProducts();
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value;
    this.filterProducts();
  }

  irCarrito() {
    this.router.navigate(['/carro']);
  }

  irPerfil() {
    this.router.navigate([this.isLoggedIn ? '/user-profile' : '/login']);
  }

  irABuscar() {
    this.router.navigate(['/buscar']);
  }

  async agregarAlCarrito(producto: Productos) {
    const currentUser = await this.bd.getCurrentUser();
    if (currentUser) {
      const added = await this.bd.agregarAlCarrito(producto, currentUser.username);
      if (added) {
        this.presentToast(`${producto.nombre} añadido al carrito`);
      }
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

  async toggleFavorite(producto: Productos, event: Event) {
    event.stopPropagation();
    // Dummy favorite logic, can be expanded later
    this.presentToast(`${producto.nombre} agregado a favoritos`);
  }

  async presentToast(msj: string) {
    const toast = await this.toastController.create({
      message: msj,
      duration: 2000,
      position: 'bottom',
      color: 'dark',
      cssClass: 'app-toast'
    });
    await toast.present();
  }

  verDetalles(idproducto: number) {
    this.router.navigate(['/dtproducto', idproducto]);
  }
}
