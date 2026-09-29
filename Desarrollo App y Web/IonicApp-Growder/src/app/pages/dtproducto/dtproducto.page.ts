import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicebdService } from '../../services/servicesbd.service';
import { Productos } from '../../services/productos';
import { take } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';

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
  selectedVariant: string = 'Normal';

  constructor(private route: ActivatedRoute,
              private router: Router,
              private bd: ServicebdService,
              private toastController: ToastController) {}

  async ngOnInit() {
    const idproducto = this.route.snapshot.paramMap.get('idproducto');
    if (idproducto) {
      await this.bd.dbState().pipe(take(1)).toPromise();
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

  private async getUsername() {
    const user = await this.bd.getCurrentUser();
    if (user) {
      this.username = user.username;
      this.foto = user.foto;
    }
  }
  
  async agregarAlCarrito() {
    const currentUser = await this.bd.getCurrentUser();
    if (currentUser) {
      const added = await this.bd.agregarAlCarrito(this.producto, currentUser.username);
      if (added) {
        this.presentToast(`${this.producto.nombre} añadido al carrito`);
      }
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
    const currentUser = await this.bd.getCurrentUser();
    if (currentUser) {
      if (this.nuevaResena.trim() && this.nuevaCalificacion >= 1) {
        this.bd.insertarResena(this.producto.idproducto, currentUser.username, this.nuevaResena, this.nuevaCalificacion)
          .then((saved) => {
            if (!saved) throw new Error('No se pudo guardar la reseña');
            this.resenas.push({ id: Date.now(), username: currentUser.username, texto: this.nuevaResena, calificacion: this.nuevaCalificacion, respuestas: [], foto: this.foto });
            this.nuevaResena = '';
            this.nuevaCalificacion = 0;
          })
          .catch(err => {
            console.error(err);
            this.bd.presentAlert('Error', 'No se pudo agregar la reseña.');
          });
      }
      else if (this.nuevaCalificacion < 1) {
        await this.presentToast('Elige una calificación de 1 a 5 estrellas.');
      }
    } else {
      this.presentToast('Inicia sesión para dejar una reseña.');
    }
  }

  async agregarRespuesta(resenaId: number) {
    const currentUser = await this.bd.getCurrentUser();
    const respuesta = this.respuestaTexto[resenaId];
    
    if (currentUser) {
      if (respuesta && respuesta.trim()) {
        try {
          await this.bd.insertarRespuesta(resenaId, respuesta, currentUser.username);
          const resena = this.resenas.find(r => r.id === resenaId);
          if (resena) {
            resena.respuestas.push({ respuesta_username: currentUser.username, respuesta_texto: respuesta });
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

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    this.presentToast(this.isFavorite ? 'Agregado a favoritos' : 'Eliminado de favoritos');
  }

  selectVariant(variant: string) {
    this.selectedVariant = variant;
  }

  goBack() {
    this.router.navigate(['/tienda']);
  }
}
