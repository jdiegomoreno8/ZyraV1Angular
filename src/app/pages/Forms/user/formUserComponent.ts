import { Component } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { Product } from '../../../components/data/models/product.model';
import { PRODUCTS } from '../../../components/data/datamodel/product';
import { ApiService } from '../../../services/api.service';  // Asegúrate de que este servicio esté bien configurado
import { MatDialog } from '@angular/material/dialog'; //inyección de MatDialog
import { MatDialogModule } from '@angular/material/dialog';
import { ProductEmpresasDialogComponent } from "../../../components/product-empresas-dialog/product-empresas-dialog.component";

@Component({
  selector: 'app-form-user',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, MatDialogModule],
  templateUrl: './formUserComponent.html',
  styleUrls: ['./formUserComponent.css']
})
export class FormUserComponent {
  products: Product[] = PRODUCTS;

  constructor(
    private router: Router,
    private dialog: MatDialog,  // Inyectamos MatDialog
    private productoEmpresaService: ApiService  // Inyectamos ApiService para consultar las empresas
  ) {}

  // Método para abrir el modal con las empresas asociadas a un producto
  abrirModal(product: Product) {
    // Usamos el servicio ApiService para obtener las empresas asociadas a este producto
    this.productoEmpresaService.getEmpresasPorProducto(product.id_producto).subscribe({
      next: (empresas) => {
        this.dialog.open(ProductEmpresasDialogComponent, {
          width: '80vw',
          maxWidth: '400px',
          data: {  // Pasamos el título y las empresas al modal
            title: product.nombre,
            descripcion: product.descripcion,
            empresas: empresas
          }
        });
      },
      error: (err) => {
        console.error('Error obteniendo empresas:', err);
      }
    });
  }
}
