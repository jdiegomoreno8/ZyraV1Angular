import { Component, Inject, AfterViewInit, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Empresa } from '../data/models/empresa.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
declare const bootstrap: any;
@Component({
  selector: 'app-product-empresas-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, RouterModule],
  templateUrl: './product-empresas-dialog.component.html',
  styleUrls: ['./product-empresas-dialog.component.css'],
})
export class ProductEmpresasDialogComponent implements AfterViewInit {
  /**
   * Constructor del componente modal.
   * @param dialogRef Referencia al diálogo para poder cerrarlo.
   * @param router Router para navegación a productos de la empresa.
   * @param data Datos inyectados que contienen el título y la lista de empresas.
   */
  constructor(
    public dialogRef: MatDialogRef<ProductEmpresasDialogComponent>,
    private router: Router,
    private elRef: ElementRef,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; empresas: Empresa[] }
  ) {
    // Asegurar que empresas siempre sea un arreglo (evita errores de acceso)
    this.data.empresas = this.data.empresas || [];
  }
    ngAfterViewInit(): void {
    const tooltipTriggerList = this.elRef.nativeElement.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltipTriggerEl: HTMLElement) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  /**
   * Cierra el diálogo/modal.
   */
  close(): void {
    this.dialogRef.close();
  }

  

  /**
   * Navega a la página de productos de la empresa seleccionada y cierra el modal.
   * @param id_empresa ID de la empresa seleccionada.
   */
  irAProdcutos(id_empresa: number): void {
    this.dialogRef.close();
    this.router.navigate(['/empresa', id_empresa, 'productos']);
  }

  get hayEmpresas(): boolean {
  return Array.isArray(this.data?.empresas) && this.data.empresas.length > 0;
}

}
