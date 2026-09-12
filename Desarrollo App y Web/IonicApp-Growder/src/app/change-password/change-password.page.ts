import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ServicebdService } from '../services/servicesbd.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePasswordPage {
  email = '';

  constructor(
    private service: ServicebdService,
    private alertController: AlertController
  ) {}

  async enviarRecuperacion() {
    if (!this.email.trim()) {
      await this.presentAlert('Falta tu correo', 'Ingresa el correo asociado a tu cuenta.');
      return;
    }
    const sent = await this.service.recuperarContrasena(this.email.trim());
    await this.presentAlert(
      sent ? 'Correo enviado' : 'No se pudo enviar',
      sent ? 'Revisa tu bandeja de entrada para continuar con la recuperación.' : 'Verifica el correo e inténtalo nuevamente.'
    );
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
