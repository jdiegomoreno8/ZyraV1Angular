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
  today: Date = new Date(); // Fecha mínima
  selectedDate: Date | null = null; // Fecha seleccionada
  idEmpresa: number | null = null; // ID recibido por URL

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Capturamos el id_empresa desde la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id_empresa');
      this.idEmpresa = id ? +id : null;

      if (this.idEmpresa) {
        console.log('ID de empresa recibido:', this.idEmpresa);
        // Aquí podrías hacer una llamada a la API para obtener citas, datos, etc.
      } else {
        console.warn('No se recibió id_empresa en la URL.');
      }
    });
  }

  /**
   * Maneja la selección de fecha desde Angular Material Datepicker
   */
  onDateSelected(date: Date | null): void {
    this.selectedDate = date;

    if (this.selectedDate) {
      const formattedDate = this.selectedDate.toISOString().split('T')[0];

      this.router.navigate(['schedule'], {
        queryParams: {
          date: formattedDate,
          empresa: this.idEmpresa, // Puedes pasar el ID si lo necesitas en la siguiente vista
        },
      });
    }
  }
}
