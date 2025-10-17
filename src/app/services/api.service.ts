//api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { Empresa } from '../components/data/models/empresa.model';
import { Product } from '../components/data/models/product.model';
import { environment } from '../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  //producción
  //private baseUrl = environment.apiUrl; //enviroment con el import { environment } from '../../enviroments/enviroment.prod';

  constructor(private http: HttpClient) {}

  // Obtener todas las citas (si las necesitas para un dashboard o admin)
  getCitas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/citas`);
  }

  getCitaPorId(id: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/citas/${id}`);
}


  //  Obtener empresas relacionadas a un producto
  getEmpresasPorProducto(productoId: number): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.baseUrl}/productos/${productoId}/empresas`).pipe(
      catchError(error => {
        console.error('Error obteniendo empresas:', error);
        return of([]); // Retorna array vacío si hay error
      })
    );
  }

  //  Obtener productos ofrecidos por una empresa
  getProductosPorEmpresa(idEmpresa: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/empresas/${idEmpresa}/productos`).pipe(
      catchError(error => {
        console.error('Error obteniendo productos:', error);
        return of([]);
      })
    );
  }

  //  Obtener los datos de una empresa por ID (nombre, ubicación, etc.)
  getEmpresaPorId(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.baseUrl}/empresas/${id}`).pipe(
      catchError(error => {
        console.error('Error obteniendo empresa:', error);
        return of({ id_empresa: id, nombre: 'Desconocida' } as Empresa);
      })
    );
  }
  
getMetodosPago(): Observable<{ id_pago: number; metodo: string }[]> {
  return this.http.get<{ id_pago: number; metodo: string }[]>(`${this.baseUrl}/metodos-pago`);
}

//obtener cita por número de ticket
getCitaPorTicket(ticket: string) {
  return this.http.get(`${this.baseUrl}/citas/ticket/${ticket}`);
}

// Eliminar (anular) cita
anularCita(id: number, comentario: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/citas/${id}/anular`, { comentario }).pipe(
    catchError(error => {
      console.error('Error anulando cita:', error);
      return of({ error: true, message: 'Error al anular la cita' });
    })
  );
}

// Modificar cita
modificarCita(id: number, datos: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/citas/${id}/modificar`, datos).pipe(
    catchError(error => {
      console.error('Error modificando cita:', error);
      return of({ error: true, message: 'Error al modificar la cita' });
    })
  );
}

//Validar código cita
validarCodigoCita(numero_ticket: string, codigo_generado: string) {
  return this.http.post<any>(`${this.baseUrl}/citas/validar-codigo`, {
    numero_ticket,
    codigo_generado
  });
}



}

