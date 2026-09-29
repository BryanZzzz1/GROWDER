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

    if (!this.carrito || this.carrito.length === 0) {
      this.presentToast('Tu carrito está vacío.', 'warning');
      return;
    }

    this.procesando = true;
    const formValues = this.checkoutForm.value;

    try {
      // 1. Obtener sesión de usuario activa
      const { data: { session } } = await this.supabase.client.auth.getSession();
      const usuarioId = session?.user?.id || null;
      const emailCliente = formValues.email?.trim() || session?.user?.email || '';

      // 2. Generar código único de orden
      const codigoOrden = `SM-${Math.floor(100000 + Math.random() * 900000)}`;

      // 3. Estructurar snapshot JSONB de items idéntico a la versión Web
      const itemsPayload = this.carrito.map(p => ({
        idproducto: p.idproducto,
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad || 1,
        imagen: p.foto || 'assets/placeholder-mate.png'
      }));

      // 4. Pre-persistencia en la tabla 'pedidos'
      const { data: pedidoData, error: dbError } = await this.supabase.client
        .from('pedidos')
        .insert({
          codigo_pedido: codigoOrden,
          usuario_id: usuarioId,
          nombre_cliente: formValues.nombre.trim(),
          email_cliente: emailCliente,
          telefono_cliente: formValues.telefono.trim(),
          region: formValues.region,
          comuna: formValues.comuna.trim(),
          direccion: formValues.direccion.trim(),
          depto: formValues.depto?.trim() || null,
          instrucciones: formValues.instrucciones?.trim() || null,
          metodo_pago: this.metodoPagoSeleccionado,
          estado: 'pendiente',
          subtotal: this.totalProductos,
          costo_envio: this.costoEnvioFijo,
          total: this.totalFinal,
          items: itemsPayload
        })
        .select()
        .single();

      if (dbError && dbError.code !== '23505') {
        throw new Error(`Error BD (${dbError.code}): ${dbError.message}`);
      }

      // 4.5. Inserción obligatoria en historial_compras
      const itemsHistorial = this.carrito.map(p => ({
        idproducto: p.idproducto,
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        precio: p.precio,
        cantidad: p.cantidad || 1,
        user_id: usuarioId,
        foto: p.foto || 'assets/placeholder-mate.png',
        fecha: new Date().toISOString()
      }));

      const { error: errorHistorial } = await this.supabase.client
        .from('historial_compras')
        .insert(itemsHistorial);

      if (errorHistorial) {
        console.error('[CHECKOUT] Error al insertar en historial_compras:', errorHistorial);
      }

      // 5. Invocación de Reserva / Descuento atómico de stock (si existe RPC)
      try {
        await this.supabase.client.rpc('crear_reserva_stock', {
          p_codigo_reserva: codigoOrden,
          p_items: itemsPayload,
          p_duracion_segundos: 120,
          p_usuario_id: usuarioId,
          p_email: emailCliente
        });
      } catch (stockEx) {
        console.warn('RPC crear_reserva_stock omitida o en fallback:', stockEx);
      }

      // 6. Invocación de Pasarela (Edge Function para Webpay o Mercado Pago)
      const { data: gatewayData, error: gatewayError } = await this.supabase.client.functions.invoke('procesar-pago', {
        body: {
          metodo: this.metodoPagoSeleccionado,
          monto: this.totalFinal,
          orden: codigoOrden,
          comprador: formValues
        }
      });

      if (gatewayError) {
        console.warn('Fallo en pasarela, pero pedido quedó registrado:', gatewayError);
      }

      // 7. Vaciar carrito y feedback al usuario
      await this.bd.vaciarCarrito();
      this.presentToast('¡Pedido registrado con éxito!', 'success');

      if (gatewayData?.url) {
        // Redirigir a pasarela en navegador / Capacitor Browser
        window.location.href = gatewayData.url;
      } else {
        // Si no retorna URL inmediata, redirigir al historial
        this.router.navigate(['/historial-compras']);
      }

    } catch (err: any) {
      console.error('[CHECKOUT ERROR]:', err);
      this.presentToast(err.message || 'Error al procesar el pedido', 'danger');
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