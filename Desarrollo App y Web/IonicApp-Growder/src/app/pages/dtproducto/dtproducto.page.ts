import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { Productos } from 'src/app/services/productos';
import { take } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  nuevaImagenUrl: string = '';
  isAdmin: boolean = false;
  currentImageIndex = 0;

  mostrarComentarios: boolean = false;

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
      this.isAdmin = user.isAdmin || false;
    }
  }
  
  async agregarAlCarrito(producto: Productos) {
    const currentUser = await this.bd.getCurrentUser();
    if (currentUser) {
      await this.bd.agregarAlCarrito(producto, currentUser.username);
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

  async agregarImagen(imagenUrl: string) {
    if (this.producto) {
      await this.bd.agregarImagen(this.producto.idproducto, imagenUrl);
      this.imagenes.push(imagenUrl);
    } else {
      this.bd.presentAlert('Error', 'No se pudo agregar la imagen.');
    }
  }

  async takePhoto() {
    const actionSheet = document.createElement('ion-action-sheet');
    actionSheet.header = 'Selecciona una opción';
    actionSheet.buttons = [
      {
        text: 'Tomar Foto',
        handler: async () => {
          try {
            const image = await Camera.getPhoto({
              quality: 100,
              resultType: CameraResultType.Base64,
              source: CameraSource.Camera,
            });
            this.agregarImagen(`data:image/jpeg;base64,${image.base64String}`);
          } catch (error) {
            console.error('Error al tomar la foto:', error);
          }
        }
      },
      {
        text: 'Seleccionar de la Galería',
        handler: async () => {
          try {
            const image = await Camera.getPhoto({
              quality: 100,
              resultType: CameraResultType.Base64,
              source: CameraSource.Photos,
            });
            this.agregarImagen(`data:image/jpeg;base64,${image.base64String}`);
          } catch (error) {
            console.error('Error al seleccionar la foto:', error);
          }
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel',
      }
    ];

    document.body.appendChild(actionSheet);
    await actionSheet.present();
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
}
