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
        .select(`
          id, idproducto, nombre, descripcion, precio, cantidad, user_id,
          producto:idproducto ( foto, cantidad, activo )
        `)
        .eq('user_id', user.id);
      if (error) throw error;
      
      const products = (data || []).map((item: any) => {
        item.foto = item.producto?.foto || item.foto || 'assets/placeholder.png';
        return item as Productos;
      });
      return products;
    } catch {
      return [];
    }
  }

  async add(producto: Productos): Promise<boolean> {
    const user = this.authService.currentUser;
    if (!user) {
      await this.alertService.present('Error', 'Debes iniciar sesión para agregar al carrito.');
      return false;
    }

    try {
      if (!(await this.hasStock(producto.idproducto, 1))) {
        await this.alertService.toast('No hay más unidades disponibles de este artículo', 'close-circle-outline');
        return false;
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
          await this.alertService.toast('No hay más unidades disponibles de este artículo', 'close-circle-outline');
          return false;
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
      return true;
    } catch (error) {
      this.alertService.handleError('Agregar al Carrito', error);
      return false;
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
    try {
      const { data: { user } } = await this.supabaseService.client.auth.getUser();
      if (!user?.id) {
        await this.alertService.toast('Error crítico: No hay usuario autenticado al comprar', 'close-circle-outline');
        return;
      }

      console.log('[COMPRA] Intentando insertar con user_id:', user.id);

      const products = await this.get();
      if (!products.length) return;

      for (const product of products) {
        const quantity = product.cantidad || 1;
        if (!(await this.hasStock(product.idproducto, quantity))) {
          await this.alertService.present('Error', `Stock insuficiente para ${product.nombre}.`);
          return;
        }
      }

      // Preparar payload para evitar múltiples insert calls si es posible
      const itemsParaInsertar = products.map(product => ({
        idproducto: product.idproducto,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        cantidad: product.cantidad || 1,
        user_id: user.id,
        foto: product.foto
      }));

      console.log('[COMPRA] Payload a insertar:', itemsParaInsertar);

      // Inserción en historial_compras
      const { data: insertData, error: insertError } = await this.supabaseService.client
        .from('historial_compras')
        .insert(itemsParaInsertar)
        .select();

      if (insertError) {
        console.error('[COMPRA ERROR INSERT]:', insertError);
        await this.alertService.present('Error al guardar compra', `${insertError.message} (${insertError.code})`);
        return; // Detener flujo, no decrementar stock ni vaciar carrito
      }

      console.log('[COMPRA INSERTADA CON ÉXITO]:', insertData);

      // Decrementar stock
      for (const product of products) {
        const quantity = product.cantidad || 1;
        const { error: rpcError } = await this.supabaseService.client.rpc('decrementar_stock', {
          p_idproducto: product.idproducto,
          p_cantidad: quantity
        });
        
        if (rpcError) {
          console.error('[COMPRA] Error al decrementar stock:', rpcError);
        }
      }

      await this.clear();
      await this.alertService.present('Éxito', 'Compra realizada correctamente y registrada en tu historial.');
    } catch (error: any) {
      console.error('purchase error:', error);
      await this.alertService.present('Realizar Compra', error.message || 'Error desconocido');
    }
  }

  async getPurchaseHistory(): Promise<any[]> {
    try {
      const { data: { user } } = await this.supabaseService.client.auth.getUser();
      if (!user?.id) {
        console.warn('[CartService] Sin usuario autenticado');
        return [];
      }

      console.log('[CartService] Consultando historial para usuario_id:', user.id);

      const { data, error } = await this.supabaseService.client
        .from('pedidos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('id', { ascending: false });

      if (error) {
        console.error('[CartService] Error en SELECT pedidos:', error);
        throw error;
      }

      console.log('[CartService] Pedidos obtenidos con éxito:', data);

      const flatCompras: any[] = [];
      for (const pedido of data || []) {
        for (const p of pedido.items || []) {
          flatCompras.push({
            id: pedido.codigo_pedido || pedido.id,
            idproducto: p.idproducto,
            foto: p.imagen || 'assets/placeholder.png',
            nombre: p.nombre,
            precio: p.precio,
            cantidad: p.cantidad,
            estado: pedido.estado || 'Pendiente'
          });
        }
      }
      return flatCompras;
    } catch (error) {
      console.error('[CartService] Error en getPurchaseHistory:', error);
      return [];
    }
  }

  async getPurchaseById(id: number): Promise<any> {
    try {
      const { data: { user } } = await this.supabaseService.client.auth.getUser();
      if (!user?.id) return null;

      const { data, error } = await this.supabaseService.client
        .from('historial_compras')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        data.foto = data.foto || 'assets/placeholder.png';
      }
      return data;
    } catch (error) {
      console.error('[CartService] Error fetching purchase by id:', error);
      return null;
    }
  }
}
