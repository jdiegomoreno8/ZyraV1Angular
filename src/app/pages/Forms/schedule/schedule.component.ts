/// <reference types="google.maps" />

import { Component, AfterViewChecked, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { Cita, CitaService } from '../../../services/cita.service';
import { ApiService } from '../../../services/api.service'; // ajusta la ruta según tu estructura


function isPlaceWithGeometry(
  place: google.maps.places.PlaceResult
): place is google.maps.places.PlaceResult & {
  geometry: google.maps.places.PlaceGeometry;
} {
  return place.geometry !== undefined && place.geometry.location !== undefined;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
})
export class ScheduleComponent implements AfterViewChecked {
  selectedDate: string | null = null;

  userData = {
  nombre: '',
  apellido: '',
  telefono: '',
  correo: '', 
  domicilio: 'no',
  direccion: '',
  hora: '',
  };

//Agregar propiedades de empresa y producto
empresaSeleccionada: string = '';
productosSeleccionados: string[] = [];
selectedProductIds: number[] = [];

startHour = '08:00';
endHour = '17:00';
availableHours: string[] = [];

showConfirmation = false;
citaParaConfirmar!: Cita;
noHayHorasDisponibles: boolean = false;

private map?: google.maps.Map;
private marker?: google.maps.Marker;
private autocomplete?: google.maps.places.Autocomplete;
private mapInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private citaService: CitaService,
    private toastr: ToastrService, // Inyectar toastr
    private apiService: ApiService, // NUEVO
    private router: Router
  ) {
    this.route.queryParams.subscribe((params) => {
   this.selectedDate = params['date'] || null;
  this.empresaSeleccionada = params['empresa_nombre'] || 'Empresa no definida';

  const productosParam = params['productos'];
  this.selectedProductIds = productosParam
    ? productosParam.split(',').map((id: string) => +id)
    : [];

  const idEmpresa = params['id_empresa'];
  if (!idEmpresa) {
    console.error("No se recibió id_empresa en parámetros");
    return;
  }

  this.cargarNombresProductos();
    });
  }

  async ngAfterViewChecked(): Promise<void> {
    if (this.userData.domicilio === 'si' && !this.mapInitialized) {
      try {
        await this.loadGoogleMapsScript();
        this.initMap();
        this.mapInitialized = true;
      } catch (error) {
        console.error('Error cargando Google Maps:', error);
      }
    }
  }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google?.maps?.places) {
        resolve();
        return;
      }

      const existingScript = document.getElementById('googleMapsScript');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.id = 'googleMapsScript';
      script.src =
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyDF-4nItghEwCXm3FuRVGijRCHODyYTngo&libraries=places';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  private initMap(): void {
    const mapEl = document.getElementById('map');
    const input = document.getElementById(
      'autocomplete'
    ) as HTMLInputElement | null;

    if (!mapEl || !input || !(window as any).google?.maps?.places) {
      console.error(
        'Elementos necesarios no disponibles para iniciar el mapa.'
      );
      return;
    }

    this.map = new google.maps.Map(mapEl, {
      center: { lat: 10.391, lng: -75.479 },
      zoom: 13,
    });

    this.marker = new google.maps.Marker({
      map: this.map,
      draggable: true,
      position: this.map.getCenter(),
    });

    this.autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['address'],
      strictBounds: false,
    });

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();

      if (!isPlaceWithGeometry(place)) {
        console.warn('No geometry available for selected place');
        return;
      }

      const location = place.geometry.location;
      if (!location) return;

      this.zone.run(() => {
        this.map!.setCenter(location);
        this.map!.setZoom(15);
        this.marker!.setPosition(location);
        this.userData.direccion = place.formatted_address ?? '';
      });
    });

    this.marker.addListener('dragend', () => {
      const pos = this.marker!.getPosition();
      if (pos) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            this.zone.run(() => {
              this.userData.direccion = results[0].formatted_address;
            });
          } else {
            this.zone.run(() => {
              this.userData.direccion = `${pos.lat().toFixed(6)}, ${pos
                .lng()
                .toFixed(6)}`;
            });
          }
        });
      }
    });

    this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const latlng = e.latLng;

      this.marker!.setPosition(latlng);
      this.map!.setCenter(latlng);

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          this.zone.run(() => {
            this.userData.direccion = results[0].formatted_address;
          });
        }
      });
    });
  }

  private generateAvailableHours(): void {
    const start = this.timeToMinutes(this.startHour);
    const end = this.timeToMinutes(this.endHour);

    this.availableHours = [];
    for (let t = start; t <= end; t += 30) {
      this.availableHours.push(this.minutesToTime(t));
    }
  }

  generateAllHours(): string[] {
    const start = this.timeToMinutes(this.startHour);
    const end = this.timeToMinutes(this.endHour);
    const allHours: string[] = [];

    for (let t = start; t <= end; t += 30) {
      allHours.push(this.minutesToTime(t));
    }

    return allHours;
  }

  selectHour(hora: string): void {
    if (this.availableHours.includes(hora)) {
      this.userData.hora = hora;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

submitForm(): void {
  const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !this.userData.nombre.trim() ||
    !this.userData.apellido.trim() ||
    !this.userData.telefono.trim() ||
    !this.userData.correo.trim() ||
    !this.userData.hora.trim() ||
    (this.userData.domicilio === 'si' && !this.userData.direccion.trim())
  ) {
    this.toastr.warning('Por favor, completa todos los campos obligatorios.', 'Campos incompletos');
    return;
  }

  if (!soloLetrasRegex.test(this.userData.nombre) || !soloLetrasRegex.test(this.userData.apellido)) {
    this.toastr.warning('El nombre y apellido solo deben contener letras.', 'Validación');
    return;
  }

  if (!correoRegex.test(this.userData.correo)) {
    this.toastr.warning('El correo ingresado no es válido.', 'Validación');
    return;
  }

  // Dirección por defecto si no se requiere domicilio
  const direccion = this.userData.domicilio === 'si' ? this.userData.direccion : 'tienda';

  this.citaParaConfirmar = {
    nombre: this.userData.nombre,
    apellido: this.userData.apellido,
    telefono: this.userData.telefono,
    correo: this.userData.correo, // nuevo campo
    domicilio: this.userData.domicilio,
    direccion,
    hora: this.userData.hora,
    fecha: this.selectedDate!,
  };

  this.showConfirmation = true;
}

cargarNombresProductos(): void {
  const idEmpresa = this.route.snapshot.queryParamMap.get('id_empresa');
  if (!idEmpresa){
      console.warn('No se recibió id_empresa en parámetros');
      return;
    }
  this.apiService.getProductosPorEmpresa(+idEmpresa).subscribe({
    next: (productos) => {
      this.productosSeleccionados = productos
        .filter(p => this.selectedProductIds.includes(p.id_producto))
        .map(p => p.nombre);
    },
    error: (error) => {
      console.error('Error al obtener productos:', error);
    }
  });
}

  confirmAppointment(): void {
    if (!this.citaParaConfirmar) {
      this.toastr.warning('No hay datos para confirmar.');
      return;
    }

    this.citaService.agendarCita(this.citaParaConfirmar).subscribe({
      next: (response) => {
        this.toastr.success('Cita registrada exitosamente.', 'Confirmación');
        console.log('Backend dice:', response);
        this.resetForm();

        if (this.selectedDate) {
          this.cargarHorasOcupadas(this.selectedDate); // actualizar después de agendar
        }

        // Redirigir al formulario de usuario
        this.router.navigate(['form-user']); // Aquí rediriges
      },
      error: (error) => {
        console.error('Error al registrar la cita:', error);
        this.toastr.error(
          'Error al registrar la cita. Intenta nuevamente.',
          'Error'
        );
      },
    });

    this.showConfirmation = false;
  }

  filtrarHorasDisponibles(horasOcupadas: string[]): void {
    this.generateAvailableHours();

    // Asegurarse que todas estén en formato "HH:mm"
    const horasNormalizadas = horasOcupadas.map((h) =>
      h.length >= 5 ? h.substring(0, 5) : h
    );

    this.availableHours = this.availableHours.filter(
      (hora) => !horasNormalizadas.includes(hora)
    );

    // Mostrar alerta si no hay horas disponibles
    this.noHayHorasDisponibles = this.availableHours.length === 0;
  }

  cargarHorasOcupadas(fecha: string): void {
    this.citaService.getHorasOcupadas(fecha).subscribe({
      next: (horasOcupadas) => {
        console.log('⏰ Horas ocupadas:', horasOcupadas);
        this.filtrarHorasDisponibles(horasOcupadas);
      },
      error: (err) => {
        console.error('Error al obtener horas ocupadas:', err);
        this.generateAvailableHours(); // fallback
      },
    });
  }

  resetForm(): void {
    this.userData = {
      nombre: '',
      apellido: '',
      telefono: '',
      correo: '',
      domicilio: 'no',
      direccion: '',
      hora: '',
    };
    this.citaParaConfirmar = undefined!;
  }

  cancelConfirmation(): void {
    this.showConfirmation = false;
  }
}

