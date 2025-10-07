//cita.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';


export interface Cita {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  domicilio: string;
  direccion: string;
  fecha: string;     // 'YYYY-MM-DD'
  hora: string;      // 'HH:mm'
  id_pago?: number | null;
  id_empresa?: number | null;
  numero_ticket?: string;
  productos: { id_producto: number; cantidad: number }[]; 
  distancia_km: number;
  costo_domicilio: number;
  observaciones: string; 
  // opcional para enviar a la bd el método de notificación
  metodo_envio: string;
}


@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrlCitas = environment.apiUrlCitas;

  constructor(private http: HttpClient) {}

  agendarCita(cita: Cita): Observable<any> {
    return this.http.post(this.apiUrlCitas, cita);
  }

getHorasOcupadas(fecha: string, idEmpresa?: number): Observable<string[]> {
  const params: any = { fecha };
  if (idEmpresa !== undefined && idEmpresa !== null) {
    params.id_empresa = idEmpresa;
  }
  return this.http.get<string[]>(`${this.apiUrlCitas}/ocupadas`, { params });
}

}
