import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { Empresa } from '../components/data/models/empresa.model';
import { Product } from '../components/data/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  // 🔹 Obtener todas las citas (si las necesitas para un dashboard o admin)
  getCitas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/citas`);
  }

  // 🔹 Obtener empresas relacionadas a un producto
  getEmpresasPorProducto(productoId: number): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.baseUrl}/productos/${productoId}/empresas`).pipe(
      catchError(error => {
        console.error('Error obteniendo empresas:', error);
        return of([]); // Retorna array vacío si hay error
      })
    );
  }

  // 🔹 Obtener productos ofrecidos por una empresa
  getProductosPorEmpresa(idEmpresa: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/empresas/${idEmpresa}/productos`).pipe(
      catchError(error => {
        console.error('Error obteniendo productos:', error);
        return of([]);
      })
    );
  }

  // 🔹 Obtener los datos de una empresa por ID (nombre, ubicación, etc.)
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

}
