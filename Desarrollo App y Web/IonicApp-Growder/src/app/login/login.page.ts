import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServicebdService } from 'src/app/services/servicesbd.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = ''; 
  password: string = '';

  constructor(private servicebd: ServicebdService, private router: Router) {}

  async onLogin() {
    if (!this.email || !this.password) {
      await this.presentAlert('Error', 'Por favor, ingresa tu correo y contraseña.');
      return; 
    }

    const result = await this.servicebd.loginUsuario(this.email, this.password);
    
    if (result.success) {
      this.router.navigate(['/tienda']); 
    } else {
      this.presentAlert('Error', result.message || 'Error desconocido.');
    }
  }

  async presentAlert(titulo: string, msj: string) {
    await this.servicebd.presentAlert(titulo, msj);
  }
}