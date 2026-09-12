import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class AlertService {
  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async present(title: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: title,
      message,
      buttons: ['Entendido'],
      cssClass: 'app-alert'
    });
    await alert.present();
  }

  async toast(message: string, icon = 'checkmark-circle-outline'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      icon,
      cssClass: 'app-toast',
      buttons: [{ icon: 'close-outline', role: 'cancel' }]
    });
    await toast.present();
  }

  handleError(context: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error en ${context}:`, message);
  }
}
