import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from './alert.service';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { Productos } from './productos';
import { ReviewService } from './review.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ServicebdService {
  constructor(
    private alertService: AlertService,
    private authService: AuthService,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private adminService: AdminService,
    private supabaseService: SupabaseService
  ) { }

  // --- HELPER PARA OBTENER EL ID REAL DE SUPABASE ---
  private async getUserId(): Promise<string | null> {
    const { data: { session } } = await this.supabaseService.client.auth.getSession();
    return session?.user?.id || null;
  }

  registrarUsuario(email: string, password: string, telefono: string, fechaNacimiento: string, foto: string) {
    return this.authService.register(email, password, telefono, fechaNacimiento, foto);
  }

  async loginUsuario(email: string, password: string) {
    const result = await this.authService.login(email, password);

    // FUSIÓN: Si el login fue exitoso, subimos el carrito local a la nube
    const userId = await this.getUserId();
    if (userId) {
      await this.fusionarCarritoLocalNube();
    }

    return result;
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  updateUser(telefono: string, fechaNacimiento: string, foto: string): Promise<boolean>;
  updateUser(_oldUsername: string, _newUsername: string, telefono: string, fechaNacimiento: string, foto: string): Promise<boolean>;
  updateUser(
    first: string,
    second: string,
    third?: string,
    fourth?: string,
    fifth?: string
  ): Promise<boolean> {
    const usesLegacySignature = fifth !== undefined;
    return this.authService.updateUser(
      usesLegacySignature ? third || '' : first,
      usesLegacySignature ? fourth || '' : second,
      usesLegacySignature ? fifth || '' : third || '',
      usesLegacySignature ? second : undefined
    );
  }

  logout(showAlert = false) {
    return this.authService.logout(showAlert);
  }

  cambiarContrasenaBase(newPassword: string) {
    return this.authService.changePassword(newPassword);
  }

  recuperarContrasena(email: string) {
    return this.authService.recoverPassword(email);
  }

  fetchProductosActivos(): Promise<Productos[]> {
    return this.productService.getActive();
  }

  fetchProductoById(id: number): Promise<Productos | null> {
    return this.productService.getById(id);
  }

  getProductosObservable(): Observable<Productos[]> {
    return this.productService.getAllObservable();
  }

  getProductById(id: number): Promise<Productos | null> {
    return this.productService.getById(id);
  }

  obtenerImagenes(productoId: number): Promise<string[]> {
    return this.productService.getImages(productoId);
  }

  async obtenerCategorias(): Promise<any[]> {
    const { data, error } = await this.supabaseService.client
      .from('categorias')
      .select('*')
      .eq('activo', true)
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data || [];
  }

  // ==========================================
  // LÓGICA DE CARRITO SINCRONIZADO (WEB / APP)
  // ==========================================

  obtenerCarritoBase(): Promise<Productos[]> {
    return this.cartService.get();
  }

  agregarAlCarritoBase(producto: Productos) {
    return this.cartService.add(producto);
  }

  async obtenerCarrito(_username?: string): Promise<Productos[]> {
    const userId = await this.getUserId();
    if (userId) {
      // Si está logueado, leemos directo de Supabase
      const { data, error } = await this.supabaseService.client
        .from('carrito')
        .select('idproducto, nombre, descripcion, precio, cantidad')
        .eq('user_id', userId);

      if (error) {
        console.error('Error obteniendo carrito de la nube:', error);
        return [];
      }
      return data as Productos[];
    } else {
      // Si es invitado, lee local
      return this.obtenerCarritoBase();
    }
  }

  async agregarAlCarrito(producto: Productos, _username?: string): Promise<void> {
    const userId = await this.getUserId();
    if (userId) {
      // 1. Buscamos si el producto ya está en el carrito de la nube
      const { data: existing } = await this.supabaseService.client
        .from('carrito')
        .select('id, cantidad')
        .eq('user_id', userId)
        .eq('idproducto', producto.idproducto)
        .maybeSingle();

      if (existing) {
        // 2. Si existe, sumamos la cantidad
        await this.supabaseService.client
          .from('carrito')
          .update({ cantidad: existing.cantidad + (producto.cantidad || 1) })
          .eq('id', existing.id);
      } else {
        // 3. Si no existe, lo insertamos
        await this.supabaseService.client
          .from('carrito')
          .insert({
            user_id: userId,
            idproducto: producto.idproducto,
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio: producto.precio,
            cantidad: producto.cantidad || 1
          });
      }
    } else {
      // Usuario Invitado
      await this.agregarAlCarritoBase(producto);
    }
  }

  async actualizarCantidad(idproducto: number, nuevaCantidad: number): Promise<void> {
    const userId = await this.getUserId();
    if (userId) {
      if (nuevaCantidad <= 0) {
        await this.eliminarDelCarrito(idproducto);
        return;
      }
      await this.supabaseService.client
        .from('carrito')
        .update({ cantidad: nuevaCantidad })
        .eq('user_id', userId)
        .eq('idproducto', idproducto);
    } else {
      await this.cartService.updateQuantity(idproducto, nuevaCantidad);
    }
  }

  async eliminarDelCarrito(idproducto: number): Promise<void> {
    const userId = await this.getUserId();
    if (userId) {
      await this.supabaseService.client
        .from('carrito')
        .delete()
        .eq('user_id', userId)
        .eq('idproducto', idproducto);
    } else {
      await this.cartService.remove(idproducto);
    }
  }

  async vaciarCarrito(): Promise<void> {
    const userId = await this.getUserId();
    if (userId) {
      await this.supabaseService.client
        .from('carrito')
        .delete()
        .eq('user_id', userId);
    } else {
      await this.cartService.clear();
    }
  }

  // --- FUNCIÓN DE MERGE (INVITADO -> USUARIO LOGUEADO) ---
  private async fusionarCarritoLocalNube() {
    const carritoLocal = await this.obtenerCarritoBase();
    if (carritoLocal && carritoLocal.length > 0) {
      console.log('Fusionando carrito local con la nube...');
      for (const item of carritoLocal) {
        await this.agregarAlCarrito(item);
      }
      // Limpiamos el carrito temporal del dispositivo
      await this.cartService.clear();
    }
  }

  // ==========================================
  // LÓGICA DE HISTORIAL DE COMPRAS (CLOUD-FIRST)
  // ==========================================

  verificarStock(idproducto: number, cantidadSolicitada: number) {
    return this.cartService.hasStock(idproducto, cantidadSolicitada);
  }

  realizarCompraBase() {
    return this.cartService.purchase();
  }

  realizarCompra(_username?: string) {
    return this.realizarCompraBase();
  }

  obtenerHistorialComprasBase(): Promise<any[]> {
    return this.cartService.getPurchaseHistory();
  }

  // MÉTODO CORREGIDO: Ahora busca en Supabase
  async obtenerHistorialCompras(_username?: string): Promise<any[]> {
    const userId = await this.getUserId();

    if (userId) {
      const { data, error } = await this.supabaseService.client
        .from('historial_compras')
        .select('*')
        .eq('user_id', userId)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error obteniendo historial desde Supabase:', error);
        return [];
      }
      return data || [];
    } else {
      return this.obtenerHistorialComprasBase();
    }
  }

  // MÉTODO CORREGIDO: Ahora busca en Supabase
  async getPurchaseById(id: number): Promise<any> {
    const userId = await this.getUserId();
    if (userId) {
      const { data, error } = await this.supabaseService.client
        .from('historial_compras')
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return data;
    }
    return this.cartService.getPurchaseById(id);
  }

  // ==========================================

  presentAlert(titulo: string, msj: string) {
    return this.alertService.present(titulo, msj);
  }

  get isUserLoggedIn(): Observable<boolean> {
    return this.authService.isUserLoggedIn;
  }

  fetchProductos() {
    return this.fetchProductosActivos();
  }

  async uploadAvatar(userId: string, base64: string): Promise<string | null> {
    try {
      const response = await fetch(base64);
      const blob = await response.blob();
      const filePath = `${userId}/${Date.now()}.jpg`;

      const { error } = await this.supabaseService.client.storage
        .from('perfiles')
        .upload(filePath, blob, { upsert: true });

      if (error) {
        console.error('Storage error:', error);
        return null;
      }

      const { data: publicUrlData } = this.supabaseService.client.storage
        .from('perfiles')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }

  cambiarContrasena(usernameOrNewPass: string, optionalNewPass?: string) {
    return this.cambiarContrasenaBase(optionalNewPass || usernameOrNewPass);
  }

  getUserByPhone(_telefono: string): Promise<any> {
    return Promise.resolve(null);
  }

  isUserActive(username: string) {
    return this.adminService.isUserActive(username);
  }

  dbState(): Observable<boolean> {
    return new BehaviorSubject(true).asObservable();
  }

  obtenerResenas(idproducto: number) {
    return this.reviewService.getReviews(idproducto);
  }

  obtenerRespuestas(idresena: number) {
    return this.reviewService.getReplies(idresena);
  }

  insertarResena(idproducto: number, username: string, texto: string, rating = 5) {
    return this.reviewService.addReview(idproducto, username, texto, rating);
  }

  insertarRespuesta(idresena: number, respuestaTexto: string, username: string) {
    return this.reviewService.addReply(idresena, respuestaTexto, username);
  }

  agregarImagen(productoId: number, url: string) {
    return this.productService.addImage(productoId, url);
  }

  setUserLoggedIn(status: boolean) {
    this.authService.setLoggedIn(status);
  }

  getAdminStatus() {
    return this.adminService.getAdminStatus();
  }

  activarProducto(idproducto: number) {
    return this.productService.activate(idproducto);
  }

  obtenerTodasLasCompras() {
    return this.adminService.getAllPurchases();
  }

  getUserByUsername(username: string) {
    return this.adminService.getUserByUsername(username);
  }

  isAdmin() {
    return this.adminService.isAdmin();
  }

  cambiarContrasenaAdmin(_username: string, newPassword: string) {
    return this.adminService.changePasswordForCurrentUser(newPassword);
  }

  cambiarContrasenaActual(username: string, currentPassword: string, newPassword: string) {
    return this.adminService.changeCurrentPassword(username, currentPassword, newPassword);
  }
}