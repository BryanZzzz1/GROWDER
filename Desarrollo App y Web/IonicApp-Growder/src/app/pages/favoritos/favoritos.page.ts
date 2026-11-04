import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { FavoritesService } from '../../services/favorites.service';
import { ServicebdService } from '../../services/servicesbd.service';
import { Productos } from '../../services/productos';

@Component({
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
})
export class FavoritosPage {
  productos: Productos[] = [];
  cargando = false;

  constructor(
    private favs: FavoritesService,
    private bd: ServicebdService,
    private router: Router,
    private toast: ToastController
  ) {}

  async ionViewWillEnter() {
    this.cargando = true;
    try {
      this.productos = await this.favs.obtenerProductos();
    } finally {
      this.cargando = false;
    }
  }

  ver(p: Productos) { this.router.navigate(['/dtproducto', p.idproducto]); }
  volver() { this.router.navigate(['/user-profile']); }
  irTienda() { this.router.navigate(["/tienda"]); }

  async quitar(p: Productos, ev: Event) {
    ev.stopPropagation();
    await this.favs.toggle(p.idproducto);
    this.productos = this.productos.filter(x => x.idproducto !== p.idproducto);
    this.mostrar('Eliminado de favoritos');
  }

  async agregar(p: Productos, ev: Event) {
    ev.stopPropagation();
    const user = await this.bd.getCurrentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    await this.bd.agregarAlCarrito(p, user.username);
    this.mostrar(`${p.nombre} añadido al carrito`);
  }

  private async mostrar(message: string) {
    const t = await this.toast.create({ message, duration: 1800, color: 'dark', position: 'bottom', cssClass: 'app-toast' });
    await t.present();
  }
}
