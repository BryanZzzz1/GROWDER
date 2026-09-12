import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from './alert.service';
import { Productos } from './productos';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productsSubject = new BehaviorSubject<Productos[]>([]);

  constructor(
    private supabaseService: SupabaseService,
    private alertService: AlertService
  ) {}

  async getActive(): Promise<Productos[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('producto')
        .select('*')
        .eq('activo', true);
      if (error) throw error;
      const products = data || [];
      this.productsSubject.next(products);
      return products;
    } catch (error) {
      this.alertService.handleError('Obtener Productos', error);
      return [];
    }
  }

  async getById(id: number): Promise<Productos | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('producto')
        .select('*')
        .eq('idproducto', id)
        .single();
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  }

  getAllObservable(): Observable<Productos[]> {
    return this.productsSubject.asObservable();
  }

  async getImages(productoId: number): Promise<string[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('imagenes')
        .select('url')
        .eq('productoId', productoId);
      if (error) throw error;
      return data?.map(image => image.url) || [];
    } catch {
      return [];
    }
  }

  async addImage(productoId: number, url: string): Promise<void> {
    await this.supabaseService.client.from('imagenes').insert({ productoId, url });
  }

  async activate(idproducto: number): Promise<void> {
    await this.supabaseService.client
      .from('producto')
      .update({ activo: true })
      .eq('idproducto', idproducto);
  }
}
