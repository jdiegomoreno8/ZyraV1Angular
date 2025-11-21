// history.component.ts
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
import { CitaService } from '../../../services/cita.service';
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

  private isBrowser: boolean;

  constructor(
    private CitaService: CitaService,
    private ApiService: ApiService, 
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

      // Enfoca input cuando modal ya está visible
      this.modalEl.addEventListener('shown.bs.modal', () => {
        this.inputCodigoRef?.nativeElement?.focus();
      });
    }

    // Limpiar backdrop al cerrar cualquier modal
    const modalesIds = ['citaModal', 'codigoModal', 'citaAnuladaModal'];
    modalesIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('hidden.bs.modal', () => this._removeBackdrop());
      }
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    // Limpieza extra de backdrops
    this._removeBackdrop();
  }

buscarCita() {
  if (!this.ticketInput.trim()) return;

  this.error = '';
  this.loading = true;

  this.CitaService.getCitaPorTicket(this.ticketInput.trim()).subscribe({
    next: (data) => {
      this.cita = data;
      this.loading = false;

      // 🔹 Completar datos faltantes de empresa y pago
      this._completarDatosCita();

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

  if (!this.isBrowser) return;

  // Cerrar modal de cita si está abierto
  const citaModalEl = document.getElementById('citaModal');
  const citaModalInstance = citaModalEl ? bootstrap.Modal.getInstance(citaModalEl) : null;
  if (citaModalInstance) {
    citaModalInstance.hide();
  }

  // Asegurarse de tener instancia de modal
  const codigoModalEl = document.getElementById('codigoModal');
  if (codigoModalEl) {
    this.codigoModalInstance = new bootstrap.Modal(codigoModalEl);
    this.codigoModalInstance.show();
  }
}



  private _completarDatosCita() {
  if (!this.cita) return;

  // Obtener nombre de la empresa si no vino desde la API de citas
  if (!this.cita.empresa_nombre && this.cita.id_empresa) {
    this.ApiService.getEmpresaPorId(this.cita.id_empresa).subscribe({
      next: (empresa) => {
        this.cita.empresa_nombre = empresa.nombre;
      },
      error: (err) => console.error('Error al obtener empresa:', err)
    });
  }

  // Obtener método de pago si solo vino el ID
  if (!this.cita.metodo_pago && this.cita.id_pago) {
    this.ApiService.getMetodosPago().subscribe({
      next: (metodos) => {
        const metodo = metodos.find(m => m.id_pago === this.cita.id_pago);
        if (metodo) this.cita.metodo_pago = metodo.metodo;
      },
      error: (err) => console.error('Error al obtener métodos de pago:', err)
    });
  }
}


validarCodigo() {
  if (!this.codigoIngresado || !this.cita?.numero_ticket) {
    this.errorCodigo = 'Debe ingresar un código válido';
    return;
  }

  this.errorCodigo = '';
  this.loadingCodigo = true;

  this.CitaService.validarCodigoCita(this.cita.numero_ticket, this.codigoIngresado).subscribe({
    next: () => {
      this.loadingCodigo = false;

      // 🔹 Si hay modal activo, cerrarlo y luego navegar
      if (this.codigoModalInstance) {
        const modalEl = document.getElementById('codigoModal');
        if (modalEl) {
          modalEl.addEventListener('hidden.bs.modal', () => this._navigateAfterValidation(), { once: true });
        }
        this.codigoModalInstance.hide();
      } else {
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
    if (this.codigoModalInstance) this.codigoModalInstance.hide();
    this.limpiarModalCodigo();
    this._removeBackdrop();
  }

  limpiarModalCodigo() {
    this.codigoIngresado = '';
    this.errorCodigo = '';
    this.loadingCodigo = false;
    this.accionPendiente = null;
  }

private _navigateAfterValidation() {
  if (!this.cita) return;

  if (this.accionPendiente === 'editar') {
    this.router.navigate(['/editar-cita'], {
      queryParams: {
        empresa: this.cita.id_empresa,
        empresa_nombre: this.cita.empresa_nombre,
        date: this.cita.fecha,
        productos: this._formatearProductos(this.cita.productos),
        citaId: this.cita.id
      }
    });
  } else if (this.accionPendiente === 'anular') {
    this.router.navigate(['/anular-cita', this.cita.id]);
  }
}

  private _formatearProductos(productos: { id_producto: number, cantidad: number }[]): string {
    return productos.map(p => `${p.id_producto}:${p.cantidad}`).join(',');
  }

  private _removeBackdrop() {
    if (!this.isBrowser) return;

    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    document.body.classList.remove('modal-open');
  }
}
