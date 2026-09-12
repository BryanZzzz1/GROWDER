import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';
import { AuthService } from './auth.service';
import { Productos } from './productos';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  async get(): Promise<Productos[]> {
    const user = this.authService.currentUser;
    if (!user) return [];

    try {
      const { data, error } = await this.supabaseService.client
        .from('carrito')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  async add(producto: Productos): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) {
      await this.alertService.present('Error', 'Debes iniciar sesión para agregar al carrito.');
      return;
    }

    try {
      if (!(await this.hasStock(producto.idproducto, 1))) {
        await this.alertService.present('Error', `No hay suficiente stock para ${producto.nombre}.`);
        return;
      }

      const { data: existingProduct } = await this.supabaseService.client
        .from('carrito')
        .select('id, cantidad')
        .eq('idproducto', producto.idproducto)
        .eq('user_id', user.id)
        .single();

      if (existingProduct) {
        const newQuantity = existingProduct.cantidad + 1;
        if (!(await this.hasStock(producto.idproducto, newQuantity))) {
          await this.alertService.present('Error', `No hay suficiente stock para ${producto.nombre}.`);
          return;
        }
        await this.supabaseService.client.from('carrito')
          .update({ cantidad: newQuantity }).eq('id', existingProduct.id);
      } else {
        await this.supabaseService.client.from('carrito').insert({
          idproducto: producto.idproducto,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          cantidad: 1,
          user_id: user.id
        });
      }

      await this.alertService.toast(`${producto.nombre} se agregó al carrito.`);
    } catch (error) {
      this.alertService.handleError('Agregar al Carrito', error);
    }
  }

  async updateQuantity(idproducto: number, nuevaCantidad: number): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    if (nuevaCantidad <= 0) {
      await this.remove(idproducto);
      return;
    }

    try {
      await this.supabaseService.client.from('carrito')
        .update({ cantidad: nuevaCantidad })
        .eq('idproducto', idproducto)
        .eq('user_id', user.id);
    } catch (error) {
      this.alertService.handleError('Actualizar Cantidad', error);
    }
  }

  async remove(idproducto: number): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    try {
      await this.supabaseService.client.from('carrito').delete()
        .eq('idproducto', idproducto).eq('user_id', user.id);
    } catch (error) {
      this.alertService.handleError('Eliminar del Carrito', error);
    }
  }

  async clear(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    try {
      await this.supabaseService.client.from('carrito').delete().eq('user_id', user.id);
    } catch (error) {
      this.alertService.handleError('Vaciar Carrito', error);
    }
  }

  async hasStock(idproducto: number, cantidadSolicitada: number): Promise<boolean> {
    const { data } = await this.supabaseService.client.from('producto')
      .select('cantidad').eq('idproducto', idproducto).single();
    return !!data && data.cantidad >= cantidadSolicitada;
  }

  async purchase(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    try {
      const products = await this.get();
      if (!products.length) return;

      for (const product of products) {
        const quantity = product.cantidad || 1;
        if (!(await this.hasStock(product.idproducto, quantity))) {
          await this.alertService.present('Error', `Stock insuficiente para ${product.nombre}.`);
          return;
        }
      }

      for (const product of products) {
        const quantity = product.cantidad || 1;
        await this.supabaseService.client.from('historial_compras').insert({
          idproducto: product.idproducto,
          nombre: product.nombre,
          descripcion: product.descripcion,
          precio: product.precio,
          cantidad: quantity,
          user_id: user.id,
          foto: product.foto
        });
        await this.supabaseService.client.rpc('decrementar_stock', {
          p_idproducto: product.idproducto,
          p_cantidad: quantity
        });
      }

      await this.clear();
      await this.alertService.present('Éxito', 'Compra realizada correctamente.');
    } catch (error) {
      this.alertService.handleError('Realizar Compra', error);
    }
  }

  async getPurchaseHistory(): Promise<any[]> {
    const user = this.authService.currentUser;
    if (!user) return [];
    try {
      const { data, error } = await this.supabaseService.client.from('historial_compras')
        .select('*, producto(foto)').eq('user_id', user.id).order('fecha', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }
}
