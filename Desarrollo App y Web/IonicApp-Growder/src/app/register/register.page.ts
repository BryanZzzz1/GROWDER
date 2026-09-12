import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServicebdService } from '../services/servicesbd.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  email!: string; // Cambiado de username a email
  password!: string;
  telefono!: string;
  fechaNacimiento!: string; 
  foto!: string;
  progress: number = 0; 

  constructor(
    private serviceBD: ServicebdService,
    private router: Router,
    private alertController: AlertController
  ) {}

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
            this.foto = `data:image/jpeg;base64,${image.base64String}`; 
            this.calculateProgress(); 
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
            this.foto = `data:image/jpeg;base64,${image.base64String}`; 
            this.calculateProgress(); 
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

  calculateProgress() {
    const totalFields = 5;
    // Evaluamos 'email' en lugar de 'username'
    const filledFields = [this.email, this.password, this.telefono, this.fechaNacimiento, this.foto]
      .filter(field => field).length;
    this.progress = (filledFields / totalFields) * 100; 
  }

  onPhoneInputChange(event: any) {
    const value = event.target.value.replace(/[^0-9]/g, ''); 
    this.telefono = value;
  }

  onFieldChange() {
    this.calculateProgress();
  }

  // Validación básica de formato de correo
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async register() {
    // Verificación de campos vacíos
    if (!this.email || !this.password || !this.telefono || !this.fechaNacimiento) {
      await this.presentAlert('Datos incompletos', 'Completa los campos obligatorios para crear tu cuenta.');
      return;
    }

    if (!this.validarEmail(this.email)) {
      await this.presentAlert('Correo inválido', 'Ingresa una dirección de correo válida.');
      return;
    }

    if (this.password.length < 8) {
      await this.presentAlert('Contraseña insegura', 'Usa al menos 8 caracteres para proteger tu cuenta.');
      return; 
    }

    // Si todo está correcto, enviamos a Supabase
    const registered = await this.serviceBD.registrarUsuario(
      this.email,
      this.password,
      this.telefono,
      this.fechaNacimiento,
      this.foto || 'https://ionicframework.com/docs/img/demos/avatar.svg'
    );
    if (registered) this.router.navigate(['./login']);
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({ header, message, buttons: ['Entendido'], cssClass: 'app-alert' });
    await alert.present();
  }
}