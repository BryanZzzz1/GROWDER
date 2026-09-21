import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicebdService } from '../services/servicesbd.service';
import { Productos } from '../services/productos';
import { ToastController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit {
  checkoutForm: FormGroup;
  carrito: Productos[] = [];
  totalProductos: number = 0;
  costoEnvioFijo: number = 2650;
  totalFinal: number = 0;
  metodoPagoSeleccionado: 'webpay' | 'mercadopago' = 'webpay';
  procesando: boolean = false;

  regiones = [
    'Región Metropolitana de Santiago',
    'Valparaíso',
    'Biobío',
    // ... agrega las demás
  ];

  constructor(
    private fb: FormBuilder,
    private bd: ServicebdService,
    private router: Router,
    private toastController: ToastController,
    private supabase: SupabaseService // Para llamar a la Edge Function
  ) {
    this.checkoutForm = this.fb.group({
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      region: ['Región Metropolitana de Santiago', Validators.required],
      comuna: ['', Validators.required],
      direccion: ['', Validators.required],
      depto: [''],
      instrucciones: ['']
    });
  }

  async ngOnInit() {
    await this.cargarDatosUsuario();
    await this.cargarCarrito();
  }

  async cargarDatosUsuario() {
    const user = await this.bd.getCurrentUser();
    if (user) {
      this.checkoutForm.patchValue({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
        email: user.email || ''
      });
    }
  }

  async cargarCarrito() {
    const user = await this.bd.getCurrentUser();
    if (user) {
      this.carrito = await this.bd.obtenerCarrito(user.username);
      this.calcularTotales();
    }
  }

  calcularTotales() {
    this.totalProductos = this.carrito.reduce((acc, prod) => acc + (prod.precio * (prod.cantidad || 1)), 0);
    this.totalFinal = this.totalProductos + this.costoEnvioFijo;
  }

  async procesarPago() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.presentToast('Por favor completa todos los campos obligatorios.', 'warning');
      return;
    }

    if (this.carrito.length === 0) {
      this.presentToast('Tu carrito está vacío.', 'warning');
      return;
    }

    this.procesando = true;
    const datosEnvio = this.checkoutForm.value;
    const orderId = `SM-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // AQUÍ ESTÁ EL GATILLO HACIA TU EDGE FUNCTION
      const { data, error } = await this.supabase.client.functions.invoke('procesar-pago', {
        body: {
          metodo: this.metodoPagoSeleccionado,
          monto: this.totalFinal,
          orden: orderId,
          comprador: datosEnvio
        }
      });

      if (error) throw error;

      if (data && data.url) {
        // Redirige al usuario a la URL de pago de la pasarela generada por la Edge Function
        window.location.href = data.url; 
        // Nota: En móvil, usaremos un plugin InAppBrowser o Capacitor Browser para abrir esto sin salir de la app.
      }

    } catch (err) {
      console.error('Error al procesar pago:', err);
      this.presentToast('Ocurrió un error al conectar con el servidor de pagos.', 'danger');
    } finally {
      this.procesando = false;
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}