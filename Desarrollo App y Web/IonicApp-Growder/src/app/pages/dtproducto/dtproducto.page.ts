import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicebdService } from '../../services/servicesbd.service';
import { Productos } from '../../services/productos';
import { take } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-dtproducto',
  templateUrl: './dtproducto.page.html',
  styleUrls: ['./dtproducto.page.scss'],
})
export class DtproductoPage implements OnInit {
  producto!: Productos;
  resenas: any[] = [];
  nuevaResena: string = '';
  nuevaCalificacion = 0;
  respuestaTexto: { [key: number]: string } = {};
  username: string = '';
  foto!: string;
  imagenes: string[] = [];
  currentImageIndex = 0;

  mostrarComentarios: boolean = false;
  isFavorite: boolean = false;
  private idActual = 0;
  enviandoResena = false;

  constructor(private route: ActivatedRoute,
    private router: Router,
    private bd: ServicebdService,
    private toastController: ToastController,
    private favs: FavoritesService) { }

  async ngOnInit() {
    const idproducto = this.route.snapshot.paramMap.get('idproducto');
    if (idproducto) {
      await this.bd.dbState().pipe(take(1)).toPromise();
      this.idActual = parseInt(idproducto);
      this.favs.ids$.subscribe(ids => this.isFavorite = ids.has(this.idActual));
      this.fetchProducto(parseInt(idproducto));
      await this.fetchResenas(parseInt(idproducto));
      this.getUsername();
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

  private fetchProducto(idproducto: number) {
    this.bd.fetchProductos().then(async productos => {
      this.producto = productos.find(p => p.idproducto === idproducto)!;
      this.imagenes = await this.bd.obtenerImagenes(idproducto);
      this.currentImageIndex = 0;
    });
  }

  private async fetchResenas(idproducto: number) {
    const resenas = await this.bd.obtenerResenas(idproducto);
    this.resenas = await Promise.all(resenas.map(async (resena) => {
      const respuestas = await this.bd.obtenerRespuestas(resena.id);
      return { ...resena, respuestas };
    }));
  }

  // CORRECCIÓN 1: Lógica inteligente para encontrar siempre el nombre de usuario
  private async getUsername() {
    const user = await this.bd.getCurrentUser();
    if (user) {
      if (user.nombre) {
        this.username = user.nombre.split(' ')[0];
      } else if (user.username) {
        this.username = user.username;
      } else if (user.email) {
        this.username = user.email.split('@')[0];
      } else {
        this.username = 'Usuario';
      }
      this.foto = user.foto || '';
    }
  }

  async agregarAlCarrito() {
    const currentUser = await this.bd.getCurrentUser();
    if (currentUser) {
      await this.bd.agregarAlCarrito(this.producto, this.username);
      this.presentToast(`${this.producto.nombre} añadido al carrito`);
    } else {
      const toast = await this.toastController.create({
        message: 'Inicia sesión para guardar este producto.',
        duration: 4000,
        position: 'bottom',
        icon: 'person-outline',
        buttons: [{ text: 'Ingresar', handler: () => this.router.navigate(['/login']) }]
      });
      await toast.present();
    }
  }

  async agregarResena() {
    if (this.enviandoResena) return;
    const currentUser = await this.bd.getCurrentUser();
    if (!currentUser) {
      this.presentToast('Inicia sesión para dejar una reseña.');
      return;
    }
    if (this.nuevaCalificacion < 1) {
      this.presentToast('Elige una calificación de 1 a 5 estrellas.');
      return;
    }
    if (!this.nuevaResena.trim()) {
      this.presentToast('Escribe un comentario antes de enviar.');
      return;
    }
    this.enviandoResena = true;
    try {
      const nombre = this.username || currentUser.username || (currentUser.email || 'Cliente').split('@')[0];
      const saved = await this.bd.insertarResena(this.producto.idproducto, nombre, this.nuevaResena.trim(), this.nuevaCalificacion);
      if (!saved) throw new Error('No se pudo guardar la reseña');
      this.nuevaResena = '';
      this.nuevaCalificacion = 0;
      await this.fetchResenas(this.producto.idproducto);
      this.presentToast('¡Gracias por tu reseña!');
    } catch (err: any) {
      console.error('[Reseña] Error:', err);
      this.bd.presentAlert('Error', `No se pudo agregar la reseña. ${err?.message || ''}`);
    } finally {
      this.enviandoResena = false;
    }
  }

  async agregarRespuesta(resenaId: number) {
    const currentUser = await this.bd.getCurrentUser();
    const respuesta = this.respuestaTexto[resenaId];

    if (currentUser) {
      if (respuesta && respuesta.trim()) {
        try {
          // CORRECCIÓN 3: Usamos this.username para la respuesta
          await this.bd.insertarRespuesta(resenaId, respuesta, this.username);
          const resena = this.resenas.find(r => r.id === resenaId);
          if (resena) {
            resena.respuestas.push({ respuesta_username: this.username, respuesta_texto: respuesta });
            this.respuestaTexto[resenaId] = '';
          }
        } catch (error) {
          console.error(error);
          this.presentToast('No se pudo guardar la respuesta.');
        }
      } else {
        this.presentToast('Escribe una respuesta antes de enviarla.');
      }
    } else {
      this.presentToast('Inicia sesión para responder.');
    }
  }

  toggleComentarios() {
    this.mostrarComentarios = !this.mostrarComentarios;
  }

  get productImages(): string[] {
    return [this.producto?.foto, ...this.imagenes].filter(Boolean) as string[];
  }

  nextImage() {
    if (this.productImages.length) this.currentImageIndex = (this.currentImageIndex + 1) % this.productImages.length;
  }

  previousImage() {
    if (this.productImages.length) this.currentImageIndex = (this.currentImageIndex - 1 + this.productImages.length) % this.productImages.length;
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }

  setRating(rating: number) {
    this.nuevaCalificacion = rating;
  }

  async toggleFavorite() {
    const estado = await this.favs.toggle(this.idActual);
    if (estado === null) {
      this.presentToast('Inicia sesión para guardar favoritos.');
      return;
    }
    this.presentToast(estado ? 'Agregado a favoritos' : 'Eliminado de favoritos');
  }

  goBack() {
    this.router.navigate(['/tienda']);
  }
}