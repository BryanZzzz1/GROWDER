import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from './alert.service';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { Productos } from './productos';
import { ReviewService } from './review.service';

@Injectable({ providedIn: 'root' })
export class ServicebdService {
  constructor(
    private alertService: AlertService,
    private authService: AuthService,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private adminService: AdminService
  ) {}

  registrarUsuario(email: string, password: string, telefono: string, fechaNacimiento: string, foto: string) {
    return this.authService.register(email, password, telefono, fechaNacimiento, foto);
  }

  loginUsuario(email: string, password: string) {
    return this.authService.login(email, password);
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

  obtenerImagenes(productoId: number): Promise<string[]> {
    return this.productService.getImages(productoId);
  }

  obtenerCarritoBase(): Promise<Productos[]> {
    return this.cartService.get();
  }

  agregarAlCarritoBase(producto: Productos) {
    return this.cartService.add(producto);
  }

  actualizarCantidad(idproducto: number, nuevaCantidad: number) {
    return this.cartService.updateQuantity(idproducto, nuevaCantidad);
  }

  eliminarDelCarrito(idproducto: number) {
    return this.cartService.remove(idproducto);
  }

  vaciarCarrito() {
    return this.cartService.clear();
  }

  verificarStock(idproducto: number, cantidadSolicitada: number) {
    return this.cartService.hasStock(idproducto, cantidadSolicitada);
  }

  realizarCompraBase() {
    return this.cartService.purchase();
  }

  obtenerHistorialComprasBase(): Promise<any[]> {
    return this.cartService.getPurchaseHistory();
  }

  presentAlert(titulo: string, msj: string) {
    return this.alertService.present(titulo, msj);
  }

  get isUserLoggedIn(): Observable<boolean> {
    return this.authService.isUserLoggedIn;
  }

  fetchProductos() {
    return this.fetchProductosActivos();
  }

  obtenerCarrito(_username?: string) {
    return this.obtenerCarritoBase();
  }

  realizarCompra(_username?: string) {
    return this.realizarCompraBase();
  }

  agregarAlCarrito(producto: Productos, _username?: string) {
    return this.agregarAlCarritoBase(producto);
  }

  obtenerHistorialCompras(_username?: string) {
    return this.obtenerHistorialComprasBase();
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

  insertarResena(idproducto: number, _username: string, texto: string, rating = 5) {
    return this.reviewService.addReview(idproducto, texto, rating);
  }

  insertarRespuesta(idresena: number, respuestaTexto: string, _username: string) {
    return this.reviewService.addReply(idresena, respuestaTexto);
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
