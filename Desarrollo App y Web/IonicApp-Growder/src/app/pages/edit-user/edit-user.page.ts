import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicebdService } from '../../services/servicesbd.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.page.html',
  styleUrls: ['./edit-user.page.scss'],
})
export class EditUserPage implements OnInit {
  user: any = {
    username: '',
    telefono: '',
    fecha_nacimiento: '',
    foto: ''
  };

  originalUsername: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicebd: ServicebdService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    const identifier = this.route.snapshot.paramMap.get('username');
    const currentUser = await this.servicebd.getCurrentUser();
    
    if (!identifier || !currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = { ...currentUser };
    this.user.username = this.user.username || this.user.email;
    this.user.fecha_nacimiento = this.user.fecha_nacimiento || '';
    this.user.telefono = this.user.telefono || '';
    this.user.foto = this.user.foto || '';
    this.originalUsername = this.user.username;
  }

  async guardarCambiosPerfil() {
    try {
      let finalFotoUrl = this.user.foto;
      
      // If it's a new base64 image, upload it
      if (finalFotoUrl && finalFotoUrl.startsWith('data:image')) {
        const currentUser = await this.servicebd.getCurrentUser();
        if (currentUser) {
          const uploadedUrl = await this.servicebd.uploadAvatar(currentUser.id, finalFotoUrl);
          if (uploadedUrl) {
            finalFotoUrl = uploadedUrl;
            this.user.foto = uploadedUrl; // Update locally
          }
        }
      }

      await this.servicebd.updateUser(
        this.originalUsername,
        this.user.username,
        this.user.telefono,
        this.user.fecha_nacimiento,
        finalFotoUrl
      );
      
      const toast = await this.toastController.create({
        message: 'Perfil actualizado con éxito',
        duration: 2500,
        position: 'bottom',
        color: 'dark',
        icon: 'checkmark-circle-outline',
        cssClass: 'app-toast'
      });
      await toast.present();
      
      this.router.navigate(['/user-profile']);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Hubo un problema al guardar los cambios. Inténtalo de nuevo.',
        buttons: ['Aceptar']
      });
      await alert.present();
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
              quality: 90,
              resultType: CameraResultType.Base64,
              source: CameraSource.Camera,
            });
            this.user.foto = `data:image/jpeg;base64,${image.base64String}`;
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
              quality: 90,
              resultType: CameraResultType.Base64,
              source: CameraSource.Photos,
            });
            this.user.foto = `data:image/jpeg;base64,${image.base64String}`;
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
}
