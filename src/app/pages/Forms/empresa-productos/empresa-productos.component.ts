import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApiService } from '../../../services/api.service';
import { Product } from '../../../components/data/models/product.model';
import { BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-empresa-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, BreadcrumbComponent],
  templateUrl: './empresa-productos.component.html',
  styleUrls: ['./empresa-productos.component.css']
})
export class EmpresaProductosComponent implements OnInit {
  idEmpresa!: number;
  productos: Product[] = [];
  nombreEmpresa: string = '';
  seleccionados: Set<number> = new Set();

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
        this.asignarImagen(p.nombre)
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
  this.router.navigate(['/calendar'], {
    queryParams: {
      id_empresa: this.idEmpresa,
      empresa_nombre: this.nombreEmpresa,
      productos: Array.from(this.seleccionados).join(',')
    }
  });
}


}
