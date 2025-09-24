import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Asegúrate de tener esto



// Define la estructura que espera el backend
export interface Cita {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string; // nuevo campo
  domicilio: string;
  direccion: string;
  fecha: string;    // formato YYYY-MM-DD
  hora: string;     // formato "HH:MM"
    id_pago?: number | null;
  id_empresa?: number | null;
  numero_ticket?: string;
  productos?: number[];  // lista de IDs de productos
}


@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private apiUrl = 'http://127.0.0.1:8000/citas'; // Cambia si tu backend usa otro puerto

  constructor(private http: HttpClient) {}

  /**
   * Envia una cita al backend para ser registrada en la base de datos
   * @param cita Objeto con los datos del formulario
   * @returns Observable de la respuesta del backend
   */
  agendarCita(cita: Cita): Observable<any> {
    return this.http.post(this.apiUrl, cita);
  }

  // cita.service.ts
getHorasOcupadas(fecha: string): Observable<string[]> {
  return this.http.get<{ horas_ocupadas: string[] }>(`${this.apiUrl}/ocupadas?fecha=${fecha}`)
    .pipe(map(res => res.horas_ocupadas));
}

//guardar cita

}
