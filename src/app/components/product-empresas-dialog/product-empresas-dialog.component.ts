import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { Empresa } from '../data/models/empresa.model';
import { MatDialogModule } from '@angular/material/dialog';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialogActions } from "../../../../node_modules/@angular/material/dialog/index";

@Component({
  selector: 'app-product-empresas-dialog',
  templateUrl: './product-empresas-dialog.component.html',
  styleUrls: ['./product-empresas-dialog.component.css'],
  imports: [MatDialogContent, MatDialogModule, CommonModule, RouterModule]
})
export class ProductEmpresasDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProductEmpresasDialogComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, empresas: Empresa[] }
  ) {}

  close(): void {
    this.dialogRef.close();
  }

 irAProdcutos(id_empresa: number): void {
  this.dialogRef.close();
  this.router.navigate(['/empresa', id_empresa, 'productos']);
}
}