export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface Producto {
  idproducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  activo: boolean;
  categoria?: string;
  categoria_id?: number | null;
  foto?: string;
  imagenes?: { idimagen?: number; url: string }[];
}

export interface Usuario {
  id: string;
  email: string;
  rol_id?: number;
  telefono?: string;
  activo?: boolean;
}

export interface StatusMessage {
  text: string;
  type: "success" | "error" | "info";
}

export type TabType = "inventario" | "producto" | "roles" | "pedidos";

// ==========================================
// TIPOS DE PEDIDOS (Requerido por Vercel)
// ==========================================

export type EstadoPedido = 'pendiente' | 'en despacho' | 'recibido';

export interface PedidoItem {
  id: number | string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

export interface Pedido {
  id: number;
  codigo_pedido: string;
  usuario_id?: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string;
  region: string;
  comuna: string;
  direccion: string;
  depto?: string;
  instrucciones?: string;
  metodo_pago: string;
  estado: EstadoPedido;
  subtotal: number;
  costo_envio: number;
  total: number;
  items: PedidoItem[]; 
  empresa_transporte?: string;
  numero_seguimiento?: string;
  notas_despacho?: string;
  created_at: string;
  updated_at: string;
}