//empresa.model.ts

/**
 * Modelo que representa una empresa asociada a un producto.
 */
export interface Empresa {
  id_empresa: number;           // ID único de la empresa
  id_producto: number;          // ID del producto al que está asociada
  nombre: string;               // Nombre de la empresa
  descripcion?: string;         // Descripción breve (opcional)
  telefono?: string;            // Teléfono de contacto (opcional)
  direccion?: string;           // Dirección física (opcional)
  horarios_disponibles?: string[]; // Horarios disponibles (opcional)
  lat?: number;                 // Latitud para mapa (opcional)
  lng?: number;                 // Longitud para mapa (opcional)
  logoUrl?: string;             // URL o ruta local del logo (opcional)
}

