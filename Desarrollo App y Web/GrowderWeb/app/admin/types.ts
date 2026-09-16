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

export type TabType = "inventario" | "producto" | "roles";
