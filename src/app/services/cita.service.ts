import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Cita {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  domicilio: string;
  direccion: string;
  fecha: string;     // Formato: 'YYYY-MM-DD'
  hora: string;      // Formato: 'HH:mm'
  id_pago?: number | null;
  id_empresa?: number | null;
  numero_ticket?: string;
  productos?: number[]; // IDs de productos seleccionados
  distancia_km: number;
  costo_domicilio: number;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = 'http://127.0.0.1:8000/citas';

  constructor(private http: HttpClient) {}

  /**
   * Envía una cita al backend para agendarla
   */
  agendarCita(cita: Cita): Observable<any> {
    return this.http.post(this.apiUrl, cita);
  }

  /**
   * Consulta las horas ocupadas de una empresa en una fecha
   * @param fecha YYYY-MM-DD
   * @param idEmpresa ID de la empresa
   */
  getHorasOcupadas(fecha: string, idEmpresa?: number): Observable<string[]> {
    const params: any = { fecha };
    if (idEmpresa) params.id_empresa = idEmpresa;
    return this.http.get<string[]>(`${this.apiUrl}/ocupadas`, { params });
  }
}
