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
  productosSeleccionados: { id: number, cantidad: number }[] = [];


  constructor(private router: Router, private route: ActivatedRoute) {}

ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    this.idEmpresa = params['empresa'] ? +params['empresa'] : null;
    this.empresaNombre = params['empresa_nombre'] || '';

    if (params['productos']) {
      const productoStrings = params['productos'].split(',');

      // Guarda como un array de objetos con id y cantidad
      this.productosSeleccionados = productoStrings.map((p:string) => {
        const [idStr, cantStr] = p.split(':');
        return { id: +idStr, cantidad: +cantStr || 1 };
      });
    }
  });
}


  onDateSelected(date: Date | null): void {
    this.selectedDate = date;
  }

goToSchedule(): void {
  if (!this.selectedDate || this.idEmpresa == null) {
    return;
  }

  const formattedDate = this.selectedDate.toISOString().split('T')[0];
  const queryParams: any = {
    date: formattedDate,
    empresa: this.idEmpresa,
    empresa_nombre: this.empresaNombre,
  };

  if (this.productosSeleccionados.length > 0) {
    queryParams.productos = this.productosSeleccionados
      .map(p => `${p.id}:${p.cantidad}`)
      .join(',');
  }

  this.router.navigate(['schedule'], { queryParams });
}

}
