declare var bootstrap: any;

import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class HistoryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('inputCodigo') inputCodigoRef!: ElementRef<HTMLInputElement>;

  ticketInput: string = '';
  cita: any = null;
  loading: boolean = false;
  error: string = '';

  codigoIngresado: string = '';
  errorCodigo: string = '';
  loadingCodigo: boolean = false;
  accionPendiente: 'editar' | 'anular' | null = null;

  private codigoModalInstance: any = null;
  private modalEl: HTMLElement | null = null;
  private modalShownListener: (() => void) | null = null;

  private isBrowser: boolean;

  constructor(
    private apiService: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    this.modalEl = document.getElementById('codigoModal');
    if (this.modalEl) {
      this.codigoModalInstance = new bootstrap.Modal(this.modalEl, { keyboard: false });

      // Enfoca input cuando modal ya está visible (más robusto que setTimeout)
      this.modalEl.addEventListener('shown.bs.modal', () => {
        this.inputCodigoRef?.nativeElement?.focus();
      });
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    if (this.modalEl && this.modalShownListener) {
      this.modalEl.removeEventListener('shown.bs.modal', this.modalShownListener);
    }
    // También limpia cualquier backdrop que pueda quedar colgado
    this._removeBackdrop();
  }

  buscarCita() {
    if (!this.ticketInput.trim()) return;

    this.error = '';
    this.loading = true;

    this.apiService.getCitaPorTicket(this.ticketInput.trim()).subscribe({
      next: (data) => {
        this.cita = data;
        this.loading = false;

        if (!this.isBrowser) return;

        if (this.cita.estado === 'anulada') {
          const anuladaModalEl = document.getElementById('citaAnuladaModal');
          if (anuladaModalEl) {
            const modal = new bootstrap.Modal(anuladaModalEl);
            modal.show();
          }
        } else {
          const modalEl = document.getElementById('citaModal');
          if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
          }
        }
      },
      error: (err) => {
        this.error = err.status === 404 ? 'Cita no encontrada' : 'Error al buscar cita';
        this.loading = false;
      },
    });
  }

  abrirModalCodigo(accion: 'editar' | 'anular') {
    this.accionPendiente = accion;
    this.codigoIngresado = '';
    this.errorCodigo = '';
    this.loadingCodigo = false;

    if (this.codigoModalInstance) {
      this.codigoModalInstance.show();
    }
  }

  validarCodigo() {
    if (!this.codigoIngresado || !this.cita?.numero_ticket) {
      this.errorCodigo = 'Debe ingresar un código válido';
      return;
    }

    this.errorCodigo = '';
    this.loadingCodigo = true;

    this.apiService.validarCodigoCita(this.cita.numero_ticket, this.codigoIngresado).subscribe({
      next: () => {
        this.loadingCodigo = false;

        if (this.codigoModalInstance && this.modalEl) {
          // Escuchar evento cuando modal termine de ocultarse
          const onHidden = () => {
            this.modalEl!.removeEventListener('hidden.bs.modal', onHidden);

            // Eliminar backdrop manualmente
            this._removeBackdrop();

            // Navegar sólo después de que modal esté cerrado y backdrop limpio
            this._navigateAfterValidation();
          };

          this.modalEl.addEventListener('hidden.bs.modal', onHidden);

          // Oculta el modal - esto dispara la animación y luego el evento hidden.bs.modal
          this.codigoModalInstance.hide();
        } else {
          // Por si no hay modal, navega directamente
          this._navigateAfterValidation();
        }
      },
      error: (err) => {
        this.loadingCodigo = false;
        this.errorCodigo = err.error?.message || 'Código incorrecto o error en validación';
        console.error('Error validando código:', err);
      },
    });
  }

  cerrarModalCodigo() {
    if (this.codigoModalInstance) {
      this.codigoModalInstance.hide();
    }
    this.limpiarModalCodigo();
    this._removeBackdrop(); // Limpia backdrop residual
  }

  limpiarModalCodigo() {
    this.codigoIngresado = '';
    this.errorCodigo = '';
    this.loadingCodigo = false;
    this.accionPendiente = null;
  }

  // Método auxiliar para navegación según acción
  private _navigateAfterValidation() {
    if (this.accionPendiente === 'editar') {
      this.router.navigate(['/editar-cita', this.cita.id]);
    } else if (this.accionPendiente === 'anular') {
      this.router.navigate(['/anular-cita', this.cita.id]);
    }
  }

  // Método para remover manualmente backdrop y clases de body
  private _removeBackdrop() {
    if (!this.isBrowser) return;

    // eliminar elementos .modal-backdrop que queden
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.remove());

    // quitar clase modal-open del body
    document.body.classList.remove('modal-open');
  }
}
