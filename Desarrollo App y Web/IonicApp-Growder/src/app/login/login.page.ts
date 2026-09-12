import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = ''; 
  password: string = '';

  constructor(private servicebd: ServicebdService, private router: Router, private toastController: ToastController) {}

  async onLogin() {
    if (!this.email || !this.password) {
      await this.presentToast('Completa tu correo y contraseña.', 'alert-circle-outline');
      return; 
    }

    const result = await this.servicebd.loginUsuario(this.email, this.password);
    
    if (result.success) {
      this.router.navigate(['/tienda']); 
    } else {
      this.presentToast(result.message || 'No se pudo iniciar sesión.', 'alert-circle-outline');
    }
  }

  async presentToast(message: string, icon = 'information-circle-outline') {
    const toast = await this.toastController.create({ message, duration: 2600, position: 'bottom', icon, cssClass: 'app-toast' });
    await toast.present();
  }
}