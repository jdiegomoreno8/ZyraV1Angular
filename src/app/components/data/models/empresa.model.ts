// src/app/models/empresa.model.ts

export interface Empresa {
  id_empresa: number;
  id_producto: number;
  nombre: string;
  descripcion?: string;
  telefono?: string;
  direccion?: string;
  horarios_disponibles?: string[];
  // opcional
    lat?: number;  
  lng?: number;  
}
