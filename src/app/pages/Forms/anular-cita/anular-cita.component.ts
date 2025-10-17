// anular-cita.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-anular-cita',
  templateUrl: './anular-cita.component.html',
  styleUrls: ['./anular-cita.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AnularCitaComponent implements OnInit {
  cita: any;
  comentario: string = '';
  loading: boolean = false;
  mensaje: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.loading = true;
    this.apiService.getCitaPorId(+id).subscribe({
      next: (data) => {
        this.cita = data;
        this.loading = false;
      },
      error: () => {
        this.router.navigate(['/']);
      }
    });
  }

  anularCita() {
    if (!this.comentario.trim()) {
      alert('Por favor, escribe un comentario antes de anular la cita.');
      return;
    }

    this.loading = true;

    this.apiService.anularCita(this.cita.id, this.comentario).subscribe({
      next: () => {
        this.mensaje = '✅ Cita anulada con éxito.';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: () => {
        this.mensaje = '❌ Error al anular la cita.';
        this.loading = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/']);
  }
}
