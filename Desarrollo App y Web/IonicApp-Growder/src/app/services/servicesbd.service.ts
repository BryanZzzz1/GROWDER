import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { Productos } from './productos';

@Injectable({
  providedIn: 'root'
})
export class ServicebdService {
  private supabase: SupabaseClient;
  
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private isUserLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  
  private carrito: Productos[] = [];
  private carritoSubject: BehaviorSubject<Productos[]> = new BehaviorSubject(this.carrito);
  private productosSubject: BehaviorSubject<Productos[]> = new BehaviorSubject<Productos[]>([]);

  constructor(private alertController: AlertController) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.initAuthSession();
  }

  private initAuthSession() {
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        this.currentUserSubject.next(session.user);
        this.isUserLoggedInSubject.next(true);
      }
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      const isLogged = !!session?.user;
      this.currentUserSubject.next(session?.user ?? null);
      this.isUserLoggedInSubject.next(isLogged);
    });
  }

  async registrarUsuario(email: string, password: string, telefono: string, fechaNacimiento: string, foto: string) {
    if (!email || !password || !telefono || !fechaNacimiento) {
      this.presentAlert('Registrar', 'Por favor, completa todos los campos.');
      return;
    }
    
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            telefono,
            fecha_nacimiento: fechaNacimiento,
            foto,
            activo: true
          }
        }
      });

      if (error) throw error;
      this.presentAlert("Registrar", "Usuario registrado correctamente. Revisa tu correo para verificar.");
    } catch (e: any) {
      this.handleError('Registrar', e.message);
    }
  }

  async loginUsuario(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      if (data.user?.user_metadata?.['activo'] === false) {
        await this.logout();
        return { success: false, message: 'Tu cuenta está desactivada.' };
      }

      return { success: true, message: 'Inicio de sesión exitoso.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error en el inicio de sesión.' };
    }
  }

  async getCurrentUser(): Promise<any> {
    const user = this.currentUserSubject.value;
    if (!user) return null;
    return {
      email: user.email,
      ...user.user_metadata
    };
  }

  async updateUser(telefono: string, fechaNacimiento: string, foto: string) {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        data: { telefono, fecha_nacimiento: fechaNacimiento, foto }
      });
      if (error) throw error;
      
      await this.presentAlert('Éxito', 'Los cambios se han guardado correctamente.');
      return true;
    } catch (e: any) {
      this.handleError('Actualizar Usuario', e.message);
      return false;
    }
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.presentAlert('Logout', 'Has cerrado sesión correctamente.');
  }

  async cambiarContrasenaBase(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      this.presentAlert("Éxito", "Contraseña cambiada correctamente.");
    } catch (e: any) {
      this.handleError('Cambiar Contraseña', e.message);
    }
  }

  async recuperarContrasena(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      this.presentAlert("Éxito", "Se ha enviado un enlace de recuperación a tu correo.");
    } catch (e: any) {
      this.handleError('Recuperar Contraseña', e.message);
    }
  }

  async fetchProductosActivos(): Promise<Productos[]> {
    try {
      const { data, error } = await this.supabase
        .from('producto')
        .select('*')
        .eq('activo', true);

      if (error) throw error;
      
      this.productosSubject.next(data || []);
      return data || [];
    } catch (e: any) {
      this.handleError('Obtener Productos', e.message);
      return [];
    }
  }

  async fetchProductoById(id: number): Promise<Productos | null> {
    try {
      const { data, error } = await this.supabase
        .from('producto')
        .select('*')
        .eq('idproducto', id)
        .single();

      if (error) throw error;
      return data;
    } catch (e: any) {
      return null;
    }
  }

  getProductosObservable(): Observable<Productos[]> {
    return this.productosSubject.asObservable();
  }

  async obtenerImagenes(productoId: number): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('imagenes')
        .select('url')
        .eq('productoId', productoId);

      if (error) throw error;
      return data ? data.map(img => img.url) : [];
    } catch (e: any) {
      return [];
    }
  }

  async obtenerCarritoBase(): Promise<Productos[]> {
    const user = this.currentUserSubject.value;
    if (!user) return [];

    try {
      const { data, error } = await this.supabase
        .from('carrito')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const productos = data || [];
      this.carritoSubject.next(productos);
      return productos;
    } catch (e: any) {
      return [];
    }
  }

  async agregarAlCarritoBase(producto: Productos) {
    const user = this.currentUserSubject.value;
    if (!user) {
      this.presentAlert("Error", "Debes iniciar sesión para agregar al carrito.");
      return;
    }

    try {
      const hayStock = await this.verificarStock(producto.idproducto, 1);
      if (!hayStock) {
        await this.presentAlert("Error", `No hay suficiente stock para ${producto.nombre}.`);
        return;
      }

      const { data: existingProduct } = await this.supabase
        .from('carrito')
        .select('id, cantidad')
        .eq('idproducto', producto.idproducto)
        .eq('user_id', user.id)
        .single();

      if (existingProduct) {
        const nuevaCantidad = existingProduct.cantidad + 1;
        if (!(await this.verificarStock(producto.idproducto, nuevaCantidad))) {
          await this.presentAlert("Error", `No hay suficiente stock para ${producto.nombre}.`);
          return;
        }
        await this.supabase
          .from('carrito')
          .update({ cantidad: nuevaCantidad })
          .eq('id', existingProduct.id);
      } else {
        await this.supabase.from('carrito').insert({
          idproducto: producto.idproducto,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          cantidad: 1,
          user_id: user.id
        });
      }
      this.obtenerCarritoBase();
      this.presentAlert("Éxito", `${producto.nombre} agregado al carrito.`);
    } catch (e: any) {
      this.handleError('Agregar al Carrito', e.message);
    }
  }

  async actualizarCantidad(idproducto: number, nuevaCantidad: number) {
    const user = this.currentUserSubject.value;
    if (!user) return;

    try {
      if (nuevaCantidad <= 0) {
        await this.eliminarDelCarrito(idproducto);
      } else {
        await this.supabase
          .from('carrito')
          .update({ cantidad: nuevaCantidad })
          .eq('idproducto', idproducto)
          .eq('user_id', user.id);
        this.obtenerCarritoBase();
      }
    } catch (e: any) {
      this.handleError('Actualizar Cantidad', e.message);
    }
  }

  async eliminarDelCarrito(idproducto: number) {
    const user = this.currentUserSubject.value;
    if (!user) return;

    try {
      await this.supabase
        .from('carrito')
        .delete()
        .eq('idproducto', idproducto)
        .eq('user_id', user.id);
      this.obtenerCarritoBase();
    } catch (e: any) {
      this.handleError('Eliminar del Carrito', e.message);
    }
  }

  async vaciarCarrito() {
    const user = this.currentUserSubject.value;
    if (!user) return;

    try {
      await this.supabase
        .from('carrito')
        .delete()
        .eq('user_id', user.id);
      this.obtenerCarritoBase();
    } catch (e: any) {
      this.handleError('Vaciar Carrito', e.message);
    }
  }

  async verificarStock(idproducto: number, cantidadSolicitada: number): Promise<boolean> {
    const { data } = await this.supabase
      .from('producto')
      .select('cantidad')
      .eq('idproducto', idproducto)
      .single();
      
    if (data) return data.cantidad >= cantidadSolicitada;
    return false;
  }

  async realizarCompraBase() {
    const user = this.currentUserSubject.value;
    if (!user) return;

    try {
      const productosCarrito = await this.obtenerCarritoBase();
      if (productosCarrito.length === 0) return;

      for (const producto of productosCarrito) {
        const cantidadSegura = producto.cantidad || 1;
        if (!await this.verificarStock(producto.idproducto, cantidadSegura)) {
          await this.presentAlert("Error", `Stock insuficiente para ${producto.nombre}.`);
          return;
        }
      }

      for (const producto of productosCarrito) {
        const cantidadSegura = producto.cantidad || 1;
        await this.supabase.from('historial_compras').insert({
          idproducto: producto.idproducto,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          cantidad: cantidadSegura,
          user_id: user.id,
          foto: producto.foto
        });

        await this.supabase.rpc('decrementar_stock', {
          p_idproducto: producto.idproducto,
          p_cantidad: cantidadSegura
        });
      }

      await this.vaciarCarrito();
      await this.presentAlert("Éxito", "Compra realizada correctamente.");
    } catch (e: any) {
      this.handleError('Realizar Compra', e.message);
    }
  }

  async obtenerHistorialComprasBase(): Promise<any[]> {
    const user = this.currentUserSubject.value;
    if (!user) return [];

    try {
      const { data, error } = await this.supabase
        .from('historial_compras')
        .select('*, producto(foto)')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e: any) {
      return [];
    }
  }

  public async presentAlert(titulo: string, msj: string) {
    const alert = await this.alertController.create({ header: titulo, message: msj, buttons: ['OK'] });
    await alert.present();
  }

  private handleError(context: string, error: any) {
    console.error(`Error en ${context}:`, error);
  }

  get isUserLoggedIn(): Observable<boolean> {
    return this.isUserLoggedInSubject.asObservable();
  }

  // ==========================================
  // CAPA DE COMPATIBILIDAD PARA VISTAS ANTIGUAS
  // ==========================================

  async fetchProductos(): Promise<Productos[]> {
    return this.fetchProductosActivos();
  }

  async obtenerCarrito(username?: string): Promise<Productos[]> {
    return this.obtenerCarritoBase(); 
  }

  async realizarCompra(username?: string) {
    return this.realizarCompraBase();
  }

  async agregarAlCarrito(producto: Productos, username?: string) {
    return this.agregarAlCarritoBase(producto);
  }

  async obtenerHistorialCompras(username?: string): Promise<any[]> {
    return this.obtenerHistorialComprasBase();
  }

  async cambiarContrasena(usernameOrNewPass: string, optionalNewPass?: string) {
    const pass = optionalNewPass ? optionalNewPass : usernameOrNewPass;
    return this.cambiarContrasenaBase(pass);
  }

  async getUserByPhone(telefono: string): Promise<any> {
    return null; 
  }

  async isUserActive(username: string): Promise<boolean> {
    return true; 
  }

  dbState(): Observable<boolean> {
    return new BehaviorSubject(true).asObservable();
  }

  async obtenerResenas(idproducto: number): Promise<any[]> {
    const { data } = await this.supabase.from('resena').select('*').eq('idproducto', idproducto);
    return data || [];
  }

  async obtenerRespuestas(idresena: number): Promise<any[]> {
    const { data } = await this.supabase.from('respuestas').select('*').eq('id_resena', idresena);
    return data || [];
  }

  async insertarResena(idproducto: number, username: string, texto: string) {
    const user = this.currentUserSubject.value;
    if(user) await this.supabase.from('resena').insert({ idproducto, texto, user_id: user.id });
  }

  async insertarRespuesta(idresena: number, respuestaTexto: string, username: string) {
    const user = this.currentUserSubject.value;
    if(user) await this.supabase.from('respuestas').insert({ id_resena: idresena, respuesta_texto: respuestaTexto, user_id: user.id });
  }

  async agregarImagen(productoId: number, url: string) {
    await this.supabase.from('imagenes').insert({ productoId, url });
  }

  setUserLoggedIn(status: boolean) {
    this.isUserLoggedInSubject.next(status);
  }

  getAdminStatus(): Observable<boolean> {
    return new BehaviorSubject(false).asObservable(); 
  }

  async activarProducto(idproducto: number) {
    await this.supabase.from('producto').update({ activo: true }).eq('idproducto', idproducto);
  }

  async obtenerTodasLasCompras(): Promise<any[]> {
    return []; 
  }
}