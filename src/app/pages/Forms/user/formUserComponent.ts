// formUser.component.ts

import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ElementRef 
} from '@angular/core';
import { CommonModule, isPlatformBrowser, NgClass  } from '@angular/common'; // <--- Importante
import { PRODUCTS } from '../../../components/data/datamodel/product';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../services/api.service';
import { Product } from '../../../components/data/models/product.model';
import { ProductEmpresasDialogComponent } from '../../../components/product-empresas-dialog/product-empresas-dialog.component';
import { BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";

declare var bootstrap: any;

@Component({
  selector: 'app-form-user',
  standalone: true,
  templateUrl: './formUserComponent.html', // ✅ Asegúrate de que este archivo exista
  styleUrls: ['./formUserComponent.css'],
  imports: [BreadcrumbComponent, NgClass, MatDialogModule, CommonModule ],  
})
export class FormUserComponent implements AfterViewInit {
  products = PRODUCTS;
  loadingProductId: number | null = null;

  constructor(
    private router: Router,
    private elRef: ElementRef,
    private dialog: MatDialog,
    private productoEmpresaService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object // <- Agregamos el token del entorno
  ) {}

  ngAfterViewInit(): void {
        // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = this.elRef.nativeElement.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltipTriggerEl: HTMLElement) => {
      new bootstrap.Tooltip(tooltipTriggerEl, {
  trigger: 'hover focus'
});
    });
    if (isPlatformBrowser(this.platformId)) {
      // ✅ Solo ejecutamos este código si estamos en el navegador
      setTimeout(() => {
        const tooltipTriggerList = Array.from(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.forEach((tooltipTriggerEl: any) => {
          try {
            new bootstrap.Tooltip(tooltipTriggerEl);
          } catch (err) {
            console.error('Error inicializando tooltip:', err);
          }
        });
      }, 0);
    }
  }

  abrirModal(product: Product) {
    this.loadingProductId = product.id_producto;

    setTimeout(() => {
      setTimeout(() => {
        this.productoEmpresaService
          .getEmpresasPorProducto(product.id_producto)
          .subscribe({
            next: (empresas) => {
              this.loadingProductId = null;
              this.dialog.open(ProductEmpresasDialogComponent, {
                width: '80vw',
                maxWidth: '400px',
                enterAnimationDuration: '300ms',
                exitAnimationDuration: '200ms',
                data: {
                  title: product.nombre,
                  descripcion: product.descripcion,
                  empresas: empresas,
                },
              });
            },
            error: (err) => {
              this.loadingProductId = null;
              console.error('Error obteniendo empresas:', err);
            },
          });
      }, 800);
    }, 0);
  }
}
