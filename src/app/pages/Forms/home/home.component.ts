import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  isLoading = false;  //Variable para manejar el estado del spinner

  constructor(private router: Router) {}

  go(path: string) {
    this.isLoading = true; // Activar el spinner

    // Simular carga (por ejemplo, llamada a la base de datos)
    setTimeout(() => {
      this.isLoading = false; // Ocultar spinner después del "cargado"
      this.router.navigate([path]);
    }, 2000); // 2 segundos
  }

  next(path: string){
    this.router.navigate([path]);
  }

}
