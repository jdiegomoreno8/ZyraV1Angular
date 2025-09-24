import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Product } from '../../../components/data/models/product.model';
import { ProductEmpresasDialogComponent } from '../../../components/product-empresas-dialog/product-empresas-dialog.component';
import { Empresa } from '../../../components/data/models/empresa.model';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
   imports: [CommonModule, MatDialogModule],
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  products: Product[] = [];  // esta vendría de API o estática
  isLoading: boolean = false;
  mostrarModal = false;
  cargando = false;
  empresaSeleccionada: any = null;

  constructor(
    private productoEmpresaService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.products = [
      // tu array PRODUCTS estático que ya definiste
    ];
  }

  onProductClick(product: Product): void {
    this.isLoading = true;
    this.productoEmpresaService.getEmpresasPorProducto(product.id_producto)
      .subscribe({
        next: (empresas: Empresa[]) => {
          this.isLoading = false;
          this.dialog.open(ProductEmpresasDialogComponent, {
            width: '80vw',
            maxWidth: '400px',
            data: {
              title: product.nombre,
              descripcion: product.descripcion,
              empresas: empresas
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error obteniendo empresas:', err);
        }
      });
  }

  abrirModalEmpresa(product: Product) {
    this.mostrarModal = true;
    this.cargando = true;

    this.productoEmpresaService.getEmpresasPorProducto(product.id_producto).subscribe({
      next: (res) => {
        this.empresaSeleccionada = res;
        this.cargando = false;

        //mostrar por defecto la primera empresa del array
          //  this.empresaSeleccionada = res.length > 0 ? res[0] : null;  // toma la primera empresa
          // this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar empresa', err);
        this.cargando = false;
      }
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.empresaSeleccionada = null;
  }
}
