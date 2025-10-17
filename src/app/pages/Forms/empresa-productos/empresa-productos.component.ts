import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Product } from '../../../components/data/models/product.model';
import { BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-empresa-productos',
  standalone: true,
  imports: [CommonModule, FormsModule,  BreadcrumbComponent],
  templateUrl: './empresa-productos.component.html',
  styleUrls: ['./empresa-productos.component.css']
})
export class EmpresaProductosComponent implements OnInit {
  idEmpresa!: number;
  productos: Product[] = [];
  nombreEmpresa: string = '';
  seleccionados: Set<number> = new Set();
  cantidades: Map<number, number> = new Map();


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

 ngOnInit(): void {
  this.idEmpresa = +this.route.snapshot.paramMap.get('id')!;

  this.apiService.getEmpresaPorId(this.idEmpresa).subscribe({
    next: (empresa) => {
      this.nombreEmpresa = empresa.nombre;
    },
    error: (error) => {
      console.error('Error al cargar nombre de la empresa:', error);
      this.nombreEmpresa = 'Empresa no definida';
    }
  });

  this.apiService.getProductosPorEmpresa(this.idEmpresa).subscribe({
    next: (data) => {
      this.productos = data.map(p => new Product(
        p.id_producto,
        p.nombre,
        p.descripcion,
        `/productos/${p.id_producto}`,
        this.asignarImagen(p.nombre),
        p.precio ?? 0,
        p.cantidad_existente ?? 0
      ));
    },
    error: (error) => {
      console.error('Error al cargar productos:', error);
    }
  });
}
// Asignación de las imagenes
  asignarImagen(nombre: string): string {
    const nombreLower = nombre.toLowerCase();

    if (nombreLower.includes('brass')) return 'assets/images/productos/2.jpg';
    if (nombreLower.includes('beleaf')) return 'assets/images/productos/3.jpg';
    if (nombreLower.includes('discreta')) return 'assets/images/productos/4.jpg';  
    if (nombreLower.includes('cápsula')) return 'assets/images/productos/7.jpg';
    if (nombreLower.includes('combo') && nombreLower.includes('básico')) return 'assets/images/productos/5.jpg';
    if (nombreLower.includes('combo') && nombreLower.includes('premium')) return 'assets/images/productos/5.jpg';

    return 'assets/images/productos/6.jpg';
  }

  toggleSeleccion(id: number): void {
    this.seleccionados.has(id) ? this.seleccionados.delete(id) : this.seleccionados.add(id);
  }

irACalendario(): void {
  const productosConCantidades: string[] = [];

  this.seleccionados.forEach(id => {
    const cantidad = this.cantidades.get(id) || 1;
    productosConCantidades.push(`${id}:${cantidad}`);
  });

  this.router.navigate(['/calendar'], {
    queryParams: {
      empresa: this.idEmpresa,
      empresa_nombre: this.nombreEmpresa,
      productos: productosConCantidades.join(',') 
    }
  });
}

//Sumar y restar cantidades de productos
sumarCantidad(id_producto: number, stock: number): void {
  const actual = this.cantidades.get(id_producto) || 1;

  if (actual < stock) {
    this.cantidades.set(id_producto, actual + 1);
  }
}


restarCantidad(id_producto: number): void {
  const actual = this.cantidades.get(id_producto) || 1;

  if (actual > 1) {
    this.cantidades.set(id_producto, actual - 1);
  }
}


}
