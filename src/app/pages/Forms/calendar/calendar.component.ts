import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { SidebarComponent } from '../../../sidebar/sidebar/sidebar.component';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    SidebarComponent,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  today: Date = new Date();
  selectedDate: Date | null = null;
  idEmpresa: number | null = null;
  empresaNombre: string = '';
  productosSeleccionados: number[] = [];  // Aquí los IDs reales seleccionados

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['empresa'];
      this.idEmpresa = id ? +id : null;
      this.empresaNombre = params['empresa_nombre'] || '';

      // Si ya se pasaron productos del componente anterior, captúralos
      if (params['productos']) {
        this.productosSeleccionados = params['productos']
          .split(',')
          .map((idStr: string) => +idStr);
      }
    });
  }

  onDateSelected(date: Date | null): void {
    this.selectedDate = date;

    if (this.selectedDate && this.idEmpresa != null) {
      const formattedDate = this.selectedDate.toISOString().split('T')[0];
      const queryParams: any = {
        date: formattedDate,
        empresa: this.idEmpresa,
        empresa_nombre: this.empresaNombre,
      };

      if (this.productosSeleccionados.length > 0) {
        queryParams.productos = this.productosSeleccionados.join(',');
      }
// borra esto despues
console.log('Navegando a Schedule con:');
console.log('Fecha:', formattedDate);
console.log('Empresa:', this.idEmpresa);
console.log('Productos seleccionados:', this.productosSeleccionados);
//Hasta aca
      this.router.navigate(['schedule'], { queryParams });
    } else {
      console.warn('Faltan datos para navegar: fecha o empresa.');
    }
  }
}
