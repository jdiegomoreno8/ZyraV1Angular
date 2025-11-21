// cita.service.ts
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
  productos: { id_producto: number; cantidad: number, nombrep: string }[]; 
  distancia_km: number;
  costo_domicilio: number;
  observaciones: string; 
  metodo_envio: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrlCitas = environment.apiUrlCitas; // http://127.0.0.1:8000/citas

  constructor(private http: HttpClient) {}

  // Crear cita
  agendarCita(cita: Cita): Observable<any> {
    return this.http.post(this.apiUrlCitas, cita);
  }

  // Obtener todas las citas
  getCitas(): Observable<any> {
    return this.http.get(this.apiUrlCitas);
  }

  // Obtener cita por id
  getCitaPorId(id: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.apiUrlCitas}/${id}`);
  }

  // Actualizar cita
  actualizarCita(id: number, cita: Cita): Observable<any> {
    return this.http.put(`${this.apiUrlCitas}/${id}`, cita);
  }

  // Obtener horas ocupadas (opcional idEmpresa)
  getHorasOcupadas(fecha: string, idEmpresa?: number): Observable<string[]> {
    const params: any = { fecha };
    if (idEmpresa !== undefined && idEmpresa !== null) {
      params.id_empresa = idEmpresa;
    }
    return this.http.get<string[]>(`${this.apiUrlCitas}/ocupadas`, { params });
  }

  // Obtener cita por número de ticket
  getCitaPorTicket(ticket: string): Observable<Cita> {
    return this.http.get<Cita>(`${this.apiUrlCitas}/ticket/${ticket}`);
  }

  // Validar código de cita
  validarCodigoCita(numero_ticket: string, codigo_generado: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrlCitas}/validar-codigo`, {
      numero_ticket,
      codigo_generado
    });
  }

  // Anular cita (opcional)
  anularCita(id: number, comentario: string): Observable<any> {
    return this.http.post(`${this.apiUrlCitas}/${id}/anular`, { comentario });
  }
}
