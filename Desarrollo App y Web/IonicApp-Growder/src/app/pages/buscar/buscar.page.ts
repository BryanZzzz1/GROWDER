import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Productos } from '../../services/productos';
import { ServicebdService } from '../../services/servicesbd.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-buscar',
  templateUrl: './buscar.page.html',
  styleUrls: ['./buscar.page.scss'],
})
export class BuscarPage implements OnInit {
  terminoBusqueda: string = '';
  todosLosProductos: Productos[] = [];
  productosMostrados: Productos[] = [];
  categoriaSeleccionada: string = 'Todos';
  
  // Suggested can be a random slice or just first few products
  productosSugeridos: Productos[] = [];

  constructor(
    private bd: ServicebdService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.cargarProductos();
  }

  ionViewWillEnter() {
    this.cargarProductos();
  }

  private async cargarProductos() {
    try {
      const data = await this.bd.fetchProductos();
      this.todosLosProductos = data.filter(p => p.activo);
      
      // Shuffle or pick first 4 for suggestions
      this.productosSugeridos = [...this.todosLosProductos].slice(0, 4);
      this.filtrarProductos();
    } catch (e) {
      console.error('Error al cargar productos en buscar:', e);
    }
  }

  filtrarProductos() {
    let result = this.todosLosProductos;

    // 1. Filtrar por texto
    if (this.terminoBusqueda && this.terminoBusqueda.trim() !== '') {
      const q = this.terminoBusqueda.toLowerCase();
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(q)
      );
    }

    // 2. Filtrar por categoría (opcional, simulado por nombre si no hay campo categ en Productos)
    if (this.categoriaSeleccionada !== 'Todos') {
      const cat = this.categoriaSeleccionada.toLowerCase();
      result = result.filter(p => p.nombre.toLowerCase().includes(cat));
    }

    this.productosMostrados = result;
  }

  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
    this.filtrarProductos();
  }

  verDetalles(idproducto: number) {
    this.router.navigate(['/dtproducto', idproducto]);
  }

  async agregarAlCarrito(producto: Productos) {
    const currentUser = await this.bd.getCurrentUser();
    if (currentUser) {
      await this.bd.agregarAlCarrito(producto, currentUser.username);
      this.presentToast(`${producto.nombre} añadido al carrito`);
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
      color: 'dark',
      cssClass: 'app-toast'
    });
    await toast.present();
  }
}
