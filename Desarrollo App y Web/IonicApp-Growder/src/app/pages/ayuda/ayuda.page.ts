import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    private nativeStorage: NativeStorage, // Inyecta NativeStorage
    private router: Router
  ) {}

  faqs = [
    { icon: 'bicycle-outline', pregunta: '¿Cuánto cuesta y cuánto tarda el despacho?', respuesta: 'El envío tiene tarifa plana de $2.650 CLP a todo Chile y el despacho toma entre 24 y 48 horas hábiles.' },
    { icon: 'card-outline', pregunta: '¿Qué medios de pago aceptan?', respuesta: 'Aceptamos Webpay Plus (tarjetas de crédito y débito) y Mercado Pago. El pago se realiza en un entorno seguro.' },
    { icon: 'receipt-outline', pregunta: '¿Los precios incluyen IVA?', respuesta: 'Los precios publicados son netos. Al finalizar la compra verás el desglose con el IVA (19%) y el costo de envío.' },
    { icon: 'cube-outline', pregunta: '¿Cómo reviso el estado de mi pedido?', respuesta: 'Ve a Mi Cuenta > Mis Pedidos. Allí verás cada compra y, en "Ver detalle", el seguimiento de tu envío.' },
    { icon: 'cafe-outline', pregunta: '¿Cómo curo mi mate?', respuesta: 'Llénalo con yerba usada húmeda, déjalo reposar 24 horas y repite el proceso una vez más. Evita lavarlo con detergente.' },
    { icon: 'lock-closed-outline', pregunta: '¿Cómo cambio mi contraseña?', respuesta: 'En Mi Cuenta, entra a Seguridad e ingresa tu nueva contraseña. Si la olvidaste, usa "Recuperar contraseña" en el inicio de sesión.' },
    { icon: 'time-outline', pregunta: '¿Qué hago si mi pedido se retrasa?', respuesta: 'Consulta el estado en Mis Pedidos o pregúntale a SuMate Bot con tu código de pedido (SM-XXXXXX).' },
  ];

  irAlChat() {
    this.router.navigate(['/chatbot']);
  }

  volver() {
    this.router.navigate(['/user-profile']);
  }

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
