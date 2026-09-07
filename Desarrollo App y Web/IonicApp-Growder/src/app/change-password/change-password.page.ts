import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ServicebdService } from '../services/servicesbd.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePasswordPage {
  username: string = '';
  telefono: string = '';
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';

  constructor(
    private service: ServicebdService,
    private alertController: AlertController,
    private router: Router
  ) {}

  async verificarYActualizar() {
    if (this.nuevaContrasena !== this.confirmarContrasena) {
      return this.presentAlert('Error', 'Las contraseñas no coinciden.');
    }
  
    if (this.nuevaContrasena.length < 8) {
      return this.presentAlert('Error', 'La nueva contraseña debe tener al menos 8 caracteres.');
    }
  
    const isActive = await this.service.isUserActive(this.username);
    if (!isActive) {
      return this.presentAlert('Error', 'Tu cuenta está desactivada. No puedes cambiar la contraseña.');
    }
  
    const usuario = await this.service.getUserByPhone(this.telefono);
    if (usuario && usuario.username === this.username) {
      await this.service.cambiarContrasena(this.username, this.nuevaContrasena);
      await this.presentAlert('Éxito', 'Contraseña cambiada con éxito.');
      this.router.navigate(['/login']);
    } else {
      this.presentAlert('Error', 'Usuario o teléfono incorrectos.');
    }
  }

  async presentAlert(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
