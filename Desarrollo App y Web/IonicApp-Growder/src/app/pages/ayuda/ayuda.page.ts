import { Component, OnInit } from '@angular/core';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { AlertController } from '@ionic/angular';
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';
// Importa NativeStorage

@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.page.html',
  styleUrls: ['./ayuda.page.scss'],
})
export class AyudaPage implements OnInit {
  dollarValue: number | null = null;
  pesosChilenos: number | null = null;
  amount: number = 0;
  errorMessage: string | null = null;
  conversionHistory: Array<{ amountInUSD: number, resultInCLP: number, date: string }> = [];

  constructor(
    private exchangeRateService: ExchangeRateService,
    private alertController: AlertController,
    private nativeStorage: NativeStorage // Inyecta NativeStorage
  ) {}

  ngOnInit() {
    console.log('Iniciando AyudaPage');
    this.getDollarValue();
    this.loadConversionHistory(); // Cargar historial de conversiones cuando inicie la página
  }

  async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  getDollarValue() {
    console.log('Llamando a getDollarValue en el componente');
    this.exchangeRateService.getDollarValue().subscribe({
      next: (value) => {
        console.log('Valor del dólar recibido:', value);
        this.dollarValue = value;
      },
      error: (error) => {
        console.error('Error al obtener el valor del dólar:', error);
        this.errorMessage = 'Error al obtener el valor del dólar. Inténtalo más tarde.';
        this.showAlert('Error al obtener el valor del dólar. Inténtalo más tarde.');
      }
    });
  }

  convertToChileanPesos() {
    if (this.amount <= 0) {
      this.errorMessage = 'Por favor, ingresa una cantidad valida de dolares.';  // Con los acentos correctos
      return;
    }
  
    console.log('Convirtiendo', this.amount, 'dolares a pesos chilenos');
    this.exchangeRateService.convertToChileanPesos(this.amount).subscribe({
      next: (value) => {
        console.log('Valor convertido:', value);
        this.pesosChilenos = Math.floor(value); // Aquí eliminamos los decimales
        this.errorMessage = null;
        this.saveConversionHistory(this.amount, this.pesosChilenos);  // Guardamos la conversión
      },
      error: (error) => {
        console.error('Error al convertir a pesos chilenos:', error);
        this.errorMessage = 'Error al convertir a pesos chilenos. Inténtalo más tarde.';
        this.showAlert('Error al convertir a pesos chilenos. Inténtalo más tarde.');
      }
    });
  }
  

  // Guardar historial de conversiones
  saveConversionHistory(amountInUSD: number, resultInCLP: number) {
    const currentDate = new Date().toLocaleString();
    const conversion = { amountInUSD, resultInCLP, date: currentDate };
    
    this.conversionHistory.unshift(conversion);  // Agregar la nueva conversión al principio del historial

    // Guardamos el historial en el almacenamiento nativo
    this.nativeStorage.setItem('conversionHistory', this.conversionHistory).catch(error => {
      console.error('Error al guardar el historial de conversiones:', error);
    });
  }

  // Cargar historial de conversiones
  loadConversionHistory() {
    this.nativeStorage.getItem('conversionHistory').then((history: Array<{ amountInUSD: number, resultInCLP: number, date: string }>) => {
      if (history) {
        this.conversionHistory = history;
      }
    }).catch((error) => {
      console.log('No se pudo cargar el historial de conversiones', error);
    });
  }
}
