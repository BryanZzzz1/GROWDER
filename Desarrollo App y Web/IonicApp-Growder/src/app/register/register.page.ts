import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServicebdService } from '../services/servicesbd.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
})
export class RegisterPage {
  email!: string; // Cambiado de username a email
  password!: string;
  telefono!: string;
  fechaNacimiento!: string; 
  foto!: string;
  progress: number = 0; 

  constructor(private serviceBD: ServicebdService, private router: Router) {}

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
    if (!this.email || !this.password || !this.telefono || !this.fechaNacimiento || !this.foto) {
      alert('Por favor, completa todos los campos y añade una foto.');
      return;
    }

    if (!this.validarEmail(this.email)) {
      alert('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (this.password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return; 
    }

    // Si todo está correcto, enviamos a Supabase
    await this.serviceBD.registrarUsuario(this.email, this.password, this.telefono, this.fechaNacimiento, 'https://ionicframework.com/docs/img/demos/avatar.svg');
    this.router.navigate(['./login']);
  }
}