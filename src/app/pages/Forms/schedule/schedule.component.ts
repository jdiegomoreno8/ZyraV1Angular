/// <reference types="google.maps" />

// ─── Importaciones ───────────────────────────────────────────────────────────
import { Component, AfterViewChecked, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { Cita, CitaService } from '../../../services/cita.service';
import { ApiService } from '../../../services/api.service'; // Servicio de API para productos, empresas, etc.

// ─── Helper: Validación de lugar con geometría ───────────────────────────────
function isPlaceWithGeometry(
  place: google.maps.places.PlaceResult
): place is google.maps.places.PlaceResult & {
  geometry: google.maps.places.PlaceGeometry;
} {
  return place.geometry !== undefined && place.geometry.location !== undefined;
}

  // ─── Interface metodoPago ────────────────────────────────────────────────────
interface MetodoPago {
  id_pago: number;
  metodo: string;
}

// ─── Decorador del Componente ────────────────────────────────────────────────
@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
})
export class ScheduleComponent implements AfterViewChecked {
  // ─── Estado del Usuario ────────────────────────────────────────────────────
  userData = {
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    domicilio: 'no', // "si" activa el mapa
    direccion: '',
    hora: '',
    id_pago: '', // <- puede ser string si viene del select
  };

  // ─── Parámetros de la Cita ─────────────────────────────────────────────────
  selectedDate: string | null = null;
  empresaSeleccionada: string = '';
  productosSeleccionados: string[] = [];
  selectedProductIds: number[] = [];
  //método de pago
  metodosPago: { id_pago: number; metodo: string }[] = [];


  // ─── Parámetros de la empresa ──────────────────────────────────────────────────────
  idEmpresa: number = 0;

  // ─── Control de Horas ──────────────────────────────────────────────────────
  startHour = '08:00';
  endHour = '17:00';
  availableHours: string[] = [];
  noHayHorasDisponibles: boolean = false;

  // ─── Confirmación de Cita ──────────────────────────────────────────────────
  showConfirmation = false;
  citaParaConfirmar!: Cita;
  ticketGenerado: string = '';
  ticketConfirmado: boolean = false;

  // ─── Variables de Google Maps ──────────────────────────────────────────────
  private map?: google.maps.Map;
  private marker?: google.maps.Marker;
  private autocomplete?: google.maps.places.Autocomplete;
  private mapInitialized = false;
  // Datos de la empresa
  readonly tiendaLatLng = { lat: 6.1788091, lng: -75.6009626 };
  distanciaKm: number = 0;
  costoDomicilio: number = 0;


  // ─── Constructor ───────────────────────────────────────────────────────────
  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private citaService: CitaService,
    private toastr: ToastrService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.route.queryParams.subscribe((params) => {
      this.selectedDate = params['date'] || null;
      this.empresaSeleccionada =
        params['empresa_nombre'] || 'Empresa no definida';
      this.idEmpresa = Number(this.route.snapshot.queryParamMap.get('empresa'));

      const productosParam = params['productos'];
      this.selectedProductIds = productosParam
        ? productosParam.split(',').map((id: string) => +id)
        : [];

      const idEmpresa = params['empresa'];
      if (!idEmpresa) {
        console.error('No se recibió id_empresa en parámetros');
        return;
      }

      this.cargarNombresProductos();

      if (this.selectedDate) {
        this.cargarHorasOcupadas(this.selectedDate);
      } else {
        this.generateAvailableHours();
      }

this.cargarMetodosPago();


    });
  }

  // ─── Ciclo de Vida: ngAfterViewChecked ─────────────────────────────────────
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

  // ─── Mapa: Cargar Script de Google Maps ────────────────────────────────────
  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google?.maps?.places) return resolve();

      const existingScript = document.getElementById('googleMapsScript');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.id = 'googleMapsScript';
      script.src =
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyDF-4nItghEwCXm3FuRVGijRCHODyYTngo&libraries=places,geometry';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  // ─── Mapa: Inicialización y Eventos ────────────────────────────────────────
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

    // Crear el mapa
    this.map = new google.maps.Map(mapEl, {
      center: { lat: 10.391, lng: -75.479 },
      zoom: 13,
    });

    // Crear el marcador
    this.marker = new google.maps.Marker({
      map: this.map,
      draggable: true,
      position: this.map.getCenter(),
    });

    // Configurar Autocomplete
    this.autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['address'],
      strictBounds: false,
    });

    // Evento: lugar seleccionado desde autocomplete
    this.autocomplete.addListener('place_changed', () => {
      //Revisar logs
        console.log('place_changed evento disparado');
      const place = this.autocomplete!.getPlace();
      if (!isPlaceWithGeometry(place)) return;

      const location = place.geometry.location;
      if (!location) return;

      this.zone.run(() => {
        this.map!.setCenter(location);
        this.map!.setZoom(15);
        this.marker!.setPosition(location);
        this.userData.direccion = place.formatted_address ?? '';
        // Aquí va el cálculo de distancia y costo
        this.calcularDistanciaYCosto();
      });
    });

    // Evento: marcador arrastrado manualmente
    this.marker.addListener('dragend', () => {
      //Revisar logs
        console.log('dragend evento disparado');
      const pos = this.marker!.getPosition();
      if (!pos) return;

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: pos }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          this.zone.run(() => {
            this.userData.direccion = results[0].formatted_address;

              // Cálculo de distancia y costo
          this.calcularDistanciaYCosto();
          });
        } else {
          this.zone.run(() => {
            this.userData.direccion = `${pos.lat().toFixed(6)}, ${pos
              .lng()
              .toFixed(6)}`;
               // Cálculo también si hay coordenadas sin dirección
        this.calcularDistanciaYCosto();
          });
        }
      });
    });

    // Evento: click en el mapa
    this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
      //Revisar logs
        console.log('map click evento disparado', e.latLng);
      if (!e.latLng) return;

      const latlng = e.latLng;
      this.marker!.setPosition(latlng);
      this.map!.setCenter(latlng);

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          this.zone.run(() => {
            this.userData.direccion = results[0].formatted_address;
               //  Cálculo
        this.calcularDistanciaYCosto();
          });
        }
      });
    });
  }
  // ─── Conversión calculo costo domicilio ────────────────────────────────────────────────────


calcularCostoDomicilio(distKm: number): number {
  // Si está dentro de los primeros 0,5 km (500 m = 0,5 km)
  if (distKm <= 0.5) {
    return 0;
  }
  // Resto de kilómetros cobrables
  const kmCobrar = distKm - 0.5;
  // Costo fijo por km: 2.500 COP
  return Math.round(kmCobrar * 2500);
}

private calcularDistanciaYCosto(): void {
  const destino = this.marker?.getPosition();
  if (!destino) return;

  // Verifica si geometry existe
  if (!google.maps.geometry || !google.maps.geometry.spherical) {
    console.error('google.maps.geometry.spherical no disponible');
    return;
  }

  const tiendaLatLng = new google.maps.LatLng(this.tiendaLatLng.lat, this.tiendaLatLng.lng);
  const distanciaMetros = google.maps.geometry.spherical.computeDistanceBetween(
    tiendaLatLng,
    destino
  );
  const distanciaKm = distanciaMetros / 1000;
  const costoDomicilio = this.calcularCostoDomicilio(distanciaKm);

  this.distanciaKm = distanciaKm;
  this.costoDomicilio = costoDomicilio;

  console.log(`Distancia: ${distanciaKm.toFixed(2)} km, Costo: ${costoDomicilio} COP`);
}

  // ─── Conversión de Tiempo ────────────────────────────────────────────────────

  /**
   * Convierte una hora en formato "HH:mm" a minutos totales.
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convierte una cantidad de minutos a una cadena en formato "HH:mm".
   */
  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
    // ─── Métodos de pago ────────────────────────────────────────────────────
getNombreMetodoPago(): string {
  const metodo = this.metodosPago.find(m => m.id_pago === +this.userData.id_pago);
  return metodo ? metodo.metodo : 'No especificado';
}

private cargarMetodosPago(): void {
  this.apiService.getMetodosPago().subscribe({
    next: (metodos: MetodoPago[]) => {
      this.metodosPago = metodos;
    },
    error: (err: any) => {
      console.error('Error cargando métodos de pago:', err);
    }
  });
}



  // ─── Total a pagar ────────────────────────────────────────────────────
  get totalPagar(): number {
  // Suma del costo de domicilio y otros cargos, si tienes más
  return this.costoDomicilio;
}

  // ─── Horarios Disponibles ────────────────────────────────────────────────────

  /**
   * Genera todas las horas del día en intervalos de 30 minutos.
   * Esta función puede ser útil para propósitos generales.
   */
  generateAllHours(): string[] {
    const start = this.timeToMinutes(this.startHour);
    const end = this.timeToMinutes(this.endHour);
    const allHours: string[] = [];

    for (let t = start; t <= end; t += 30) {
      allHours.push(this.minutesToTime(t));
    }

    return allHours;
  }

  /**
   * Genera y establece las horas disponibles en el componente.
   */
  private generateAvailableHours(): void {
    const start = this.timeToMinutes(this.startHour);
    const end = this.timeToMinutes(this.endHour);

    this.availableHours = [];
    for (let t = start; t <= end; t += 30) {
      this.availableHours.push(this.minutesToTime(t));
    }
  }

  /**
   * Filtra las horas disponibles eliminando aquellas que ya están ocupadas.
   */
  filtrarHorasDisponibles(horasOcupadas: string[] = []): void {
    this.generateAvailableHours();

    const horasNormalizadas = horasOcupadas.map((h) =>
      h.length >= 5 ? h.substring(0, 5) : h
    );

    this.availableHours = this.availableHours.filter(
      (hora) => !horasNormalizadas.includes(hora)
    );

    this.noHayHorasDisponibles = this.availableHours.length === 0;
  }

  /**
   * Carga las horas ocupadas desde el backend para una fecha específica.
   */
  cargarHorasOcupadas(fecha: string | null): void {
    if (!fecha) {
      this.generateAvailableHours();
      return;
    }

    this.citaService.getHorasOcupadas(fecha).subscribe({
      next: (horasOcupadas) => {
        this.filtrarHorasDisponibles(horasOcupadas || []);
      },
      error: (err) => {
        this.generateAvailableHours();
      },
    });
  }

  /**
   * Selecciona una hora específica para agendar cita.
   */
  selectHour(hora: string): void {
    if (this.availableHours.includes(hora)) {
      this.userData.hora = hora;
    }
  }

  // ─── Envío del Formulario ────────────────────────────────────────────────────

  /**
   * Envía el formulario de cita después de validar los campos.
   */
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
      this.toastr.warning(
        'Por favor, completa todos los campos obligatorios.',
        'Campos incompletos'
      );
      return;
    }

    if (
      !soloLetrasRegex.test(this.userData.nombre) ||
      !soloLetrasRegex.test(this.userData.apellido)
    ) {
      this.toastr.warning(
        'El nombre y apellido solo deben contener letras.',
        'Validación'
      );
      return;
    }

    if (!correoRegex.test(this.userData.correo)) {
      this.toastr.warning('El correo ingresado no es válido.', 'Validación');
      return;
    }

    // Asignar dirección por defecto si no aplica domicilio
    const direccion =
      this.userData.domicilio === 'si' ? this.userData.direccion : 'tienda';

    this.citaParaConfirmar = {
      nombre: this.userData.nombre,
      apellido: this.userData.apellido,
      telefono: this.userData.telefono,
      correo: this.userData.correo,
      domicilio: this.userData.domicilio,
      direccion,
      hora: this.userData.hora,
      fecha: this.selectedDate!,
      id_empresa: this.idEmpresa,
      productos: this.selectedProductIds,
      // Propiedades cotización
      distancia_km: this.distanciaKm,
      costo_domicilio: this.costoDomicilio
    };

    this.showConfirmation = true;
  }

  // ─── Confirmar y Registrar la Cita ───────────────────────────────────────────

  /**
   * Confirma y envía la cita al backend.
   */
  confirmAppointment(): void {
    if (!this.citaParaConfirmar) {
      this.toastr.warning('No hay datos para confirmar.');
      return;
    }

    this.citaService.agendarCita(this.citaParaConfirmar).subscribe({
      next: (response) => {
        this.toastr.success('Cita registrada exitosamente.', 'Confirmación');

        this.ticketGenerado = response.numero_ticket || '---';
        this.ticketConfirmado = true; // Oculta el formulario, muestra solo el ticket

        console.log('Ticket generado:', this.ticketGenerado);

        this.resetForm(); // Limpia el formulario, pero dejamos el modal abierto
      },
      error: (error) => {
        console.error('Error al registrar la cita:', error);
        this.toastr.error(
          'Error al registrar la cita. Intenta nuevamente.',
          'Error'
        );
      },
    });
  }

  // ─── Productos de la Empresa ─────────────────────────────────────────────────

  /**
   * Carga los nombres de los productos seleccionados desde el backend.
   */
  cargarNombresProductos(): void {
    const idEmpresa = this.route.snapshot.queryParamMap.get('empresa');

    if (!idEmpresa) {
      console.warn('No se recibió id_empresa en parámetros');
      return;
    }

    console.log('ID Empresa:', idEmpresa);
    console.log('selectedProductIds:', this.selectedProductIds);

    this.apiService.getProductosPorEmpresa(this.idEmpresa).subscribe({
      next: (productos) => {
        console.log('Productos recibidos:', productos);
        this.productosSeleccionados = productos
          .filter((p) =>
            this.selectedProductIds.includes(Number(p.id_producto))
          )
          .map((p) => p.nombre);
        console.log('Productos seleccionados:', this.productosSeleccionados);
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
      },
    });
  }

  // ─── Utilidades ──────────────────────────────────────────────────────────────

  /**
   * Reinicia los campos del formulario y del estado interno.
   */
  resetForm(): void {
    this.userData = {
      nombre: '',
      apellido: '',
      telefono: '',
      correo: '',
      domicilio: 'no',
      direccion: '',
      hora: '',
      id_pago: '',

    };
    this.citaParaConfirmar = undefined!;
  }
  /**Resetear el mapa */
  resetMapaDomicilio(): void {
  this.mapInitialized = false;
  this.map = undefined;
  this.marker = undefined;
  this.costoDomicilio = 0;
  this.distanciaKm = 0;
  this.userData.direccion = '';
}


  /**
   * Cancela la ventana de confirmación sin enviar la cita.
   */
  cancelConfirmation(): void {
    this.showConfirmation = false;
  }

  /**copiar el número de ticket al portapapeles al hacer clic */
  copiarAlPortapapeles(texto: string): void {
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        this.toastr.success('Ticket copiado al portapapeles.');
      })
      .catch(() => {
        this.toastr.error('No se pudo copiar el ticket.');
      });
  }

  /**Cerrar el modal con el # de ticket */
  cerrarModal(): void {
    this.showConfirmation = false;
    this.ticketConfirmado = false;
    this.ticketGenerado = '';
    // Redirigir al formulario de usuario
    this.router.navigate(['form-user']); // Aquí redirige a los productos
  }
}
