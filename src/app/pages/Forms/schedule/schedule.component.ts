//Schedule.component.ts
/// <reference types="google.maps" />

// ─── Importaciones ───────────────────────────────────────────────────────────
import { Component, AfterViewChecked, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';


import { ToastrModule, ToastrService } from 'ngx-toastr';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { Cita, CitaService } from '../../../services/cita.service';
import { ApiService } from '../../../services/api.service'; // Servicio de API para productos, empresas, etc.
import { environment } from '../../../../enviroments/enviroment';


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
// Interface Producto seleccionado

interface ProductoSeleccionado {
  id_producto: number;
  nombrep: string;
  precio: number;
  cantidad: number;
}

// ─── Decorador del Componente ────────────────────────────────────────────────
@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent ],
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
    distancia_km:0,
    hora: '',
    id_pago: '', // <- puede ser string si viene del select
    observaciones:'',
    metodoEnvioFactura: '' 
   };

  // ─── Parámetros de la Cita ─────────────────────────────────────────────────
  selectedDate: string | null = null;
  empresaSeleccionada: string = '';
  productosSeleccionados: ProductoSeleccionado[] = [];
  selectedProductIds: number[] = [];
  valorProductos: number = 0;
  costoDomicilio: number = 0;
  totalPagar: number = 0;
  modoEdicion: boolean = false;
  citaIdParaEditar: number | null = null;
  isSubmitting = false; // evita doble envío
  metodoEnvioTexto: string = '';




  //método de pago
  metodosPago: { id_pago: number; metodo: string }[] = [];
metodoPagoTexto: string = ''; 
  

  // ─── Parámetros de la empresa ──────────────────────────────────────────────────────
  idEmpresa: number = 0;

  // ─── Control de Horas ──────────────────────────────────────────────────────
  startHour = '08:00';
  endHour = '17:00';
  availableHours: string[] = [];
  noHayHorasDisponibles: boolean = false;

  // ─── Confirmación de Cita ──────────────────────────────────────────────────
  showConfirmation = false; //Controla la visibilidad del modal
  citaParaConfirmar!: Cita;
  ticketGenerado: string = '';
  ticketConfirmado: boolean = false;

  // ─── Variables de Google Maps ──────────────────────────────────────────────
  private map?: google.maps.Map;
  private marker?: google.maps.Marker;
  private autocomplete?: google.maps.places.Autocomplete;
  private mapInitialized = false;
  // Datos de la empresa
  //readonly tiendaLatLng = { lat: 6.1788091, lng: -75.6009626 };
  tiendaLatLng = {lat: 0, lng: 0};
  distancia_km: number = 0;

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

this.productosSeleccionados = productosParam
  ? productosParam.split(',').map((p: string) => {
      const [idStr, cantStr] = p.split(':');
      return {
        id_producto: +idStr,
        cantidad: +cantStr || 1,
        nombrep: '', // temporal, lo llenaremos más tarde
        precio: 0   // temporal, lo llenaremos más tarde
      } as ProductoSeleccionado;
    })
  : [];
//Manejo por id de la cita para editar
  const citaId = params['citaId'];
if (citaId) {
  this.citaIdParaEditar = +citaId;
  this.modoEdicion = true;
  this.cargarCitaExistente(+citaId);
}


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
  if (
    this.userData.domicilio === 'si' &&
    !this.mapInitialized
  ) {
    try {
      await this.loadGoogleMapsScript();

      this.mapInitialized = true;

      // Google Maps está listo, llama a:
      this.cargarUbicacionEmpresa();

      this.initMap();

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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places,geometry`;

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
  console.log('place_changed evento disparado');
  if (this.userData.domicilio !== 'si') return; //Validación

  const place = this.autocomplete!.getPlace();
  if (!isPlaceWithGeometry(place)) return;

  const location = place.geometry.location;
  if (!location) return;

  this.zone.run(() => {
    this.map!.setCenter(location);
    this.map!.setZoom(15);
    this.marker!.setPosition(location);
    this.userData.direccion = place.formatted_address ?? '';
    this.calcularDistanciaYCosto();
  });
});


    // Evento: marcador arrastrado manualmente
 this.marker.addListener('dragend', () => {
  if (this.userData.domicilio !== 'si') return; // Validación

  const pos = this.marker!.getPosition();
  if (!pos) return;

  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ location: pos }, (results, status) => {
    this.zone.run(() => {
      if (status === 'OK' && results && results[0]) {
        this.userData.direccion = results[0].formatted_address;
      } else {
        this.userData.direccion = `${pos.lat().toFixed(6)}, ${pos.lng().toFixed(6)}`;
      }

      this.calcularDistanciaYCosto();
    });
  });
});


    // Evento: click en el mapa
this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
  console.log('map click evento disparado', e.latLng);
  if (!e.latLng || this.userData.domicilio !== 'si') return; //Validación

  const latlng = e.latLng;
  this.marker!.setPosition(latlng);
  this.map!.setCenter(latlng);

  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ location: latlng }, (results, status) => {
    if (status === 'OK' && results && results[0]) {
      this.zone.run(() => {
        this.userData.direccion = results[0].formatted_address;
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

    const tiendaLatLng = new google.maps.LatLng(
      this.tiendaLatLng.lat,
      this.tiendaLatLng.lng
    );
    const distanciaMetros =
      google.maps.geometry.spherical.computeDistanceBetween(
        tiendaLatLng,
        destino
      );
    const distanciaKm = distanciaMetros / 1000;
    const costoDomicilio = this.calcularCostoDomicilio(distanciaKm);

    this.distancia_km = distanciaKm;
    this.costoDomicilio = costoDomicilio;

    console.log(
      `Distancia: ${distanciaKm.toFixed(2)} km, Costo: ${costoDomicilio} COP`
    );

    // Actualiza el total al calcular el domicilio
    this.actualizarTotal();
  }

get totalPagarCalculado(): number {
  return (
    this.valorProductos +
    (this.userData.domicilio === 'si' ? this.costoDomicilio : 0)
  );
}

   /**
   * Carga la dirección de la empresa desde la bd
   */
private cargarUbicacionEmpresa(): void {
  if (!this.idEmpresa) {
    console.warn('ID de empresa no disponible.');
    return;
  }

  this.apiService.getEmpresaPorId(this.idEmpresa).subscribe({
    next: (empresa) => {
      // Si vienen coordenadas válidas
      if (empresa.lat && empresa.lng) {
        this.tiendaLatLng = { lat: empresa.lat, lng: empresa.lng };
        console.log('Ubicación de la empresa cargada:', this.tiendaLatLng);

        if (this.map) {
          const tiendaLatLngGoogle = new google.maps.LatLng(
            this.tiendaLatLng.lat,
            this.tiendaLatLng.lng
          );
          this.map.setCenter(tiendaLatLngGoogle);
          this.calcularDistanciaYCosto();
        }

      // Si NO hay coordenadas, pero sí hay dirección física
      } else if (empresa.direccion) {
        console.log('No hay coordenadas, intentando geocodificar dirección:', empresa.direccion);
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ address: empresa.direccion }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            this.tiendaLatLng = {
              lat: location.lat(),
              lng: location.lng(),
            };
            console.log('Ubicación de empresa geocodificada:', this.tiendaLatLng);

            if (this.map) {
              this.map.setCenter(location);
              this.calcularDistanciaYCosto();
            }

          } else {
            console.warn('No se pudo geocodificar la dirección de la empresa:', status);
          }
        });

      } else {
        console.warn('La empresa no tiene coordenadas ni dirección.');
      }
    },
    error: (err) => {
      console.error('Error al obtener datos de la empresa:', err);
    },
  });
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
    const metodo = this.metodosPago.find(
      (m) => m.id_pago === +this.userData.id_pago
    );
    return metodo ? metodo.metodo : 'No especificado';
  }

  private cargarMetodosPago(): void {
    this.apiService.getMetodosPago().subscribe({
      next: (metodos: MetodoPago[]) => {
        this.metodosPago = metodos;
      },
      error: (err: any) => {
        console.error('Error cargando métodos de pago:', err);
      },
    });
  }

  // ─── Total a pagar ────────────────────────────────────────────────────

  actualizarTotal() {
    this.totalPagar =
      this.valorProductos +
      (this.userData.domicilio === 'si' ? this.costoDomicilio : 0);
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

generateAvailableHours(): void {
  if (!this.selectedDate) {
    this.availableHours = [];
    return;
  }

  // Convertir string a Date si es necesario
  const selectedDateObj = new Date(this.selectedDate);

  const start = this.timeToMinutes(this.startHour); // ej: "08:00"
  const end = this.timeToMinutes(this.endHour);     // ej: "20:00"
  this.availableHours = [];

  const now = new Date();

  // Calcula el minuto mínimo permitido
  let minMinutes = start;

  // Si la fecha seleccionada es hoy
  if (
    selectedDateObj.getFullYear() === now.getFullYear() &&
    selectedDateObj.getMonth() === now.getMonth() &&
    selectedDateObj.getDate() === now.getDate()
  ) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    minMinutes = Math.max(start, currentMinutes + 120); // +2 horas
  }

  // Genera horarios de 30 en 30 minutos
  for (let t = start; t <= end; t += 30) {
    if (t >= minMinutes) {
      this.availableHours.push(this.minutesToTime(t));
    }
  }
}



onDateChange(newDate: string) {
  this.selectedDate = newDate;
  this.generateAvailableHours();
}


/**
 * Normaliza los productos seleccionados para enviarlos correctamente al backend.
 */
private normalizeProductos(): { id_producto: number; cantidad: number; nombrep: string }[] {
  return this.productosSeleccionados.map(p => ({
    id_producto: p.id_producto,
    cantidad: p.cantidad,
    nombrep: p.nombrep || 'Producto desconocido' // usa 'nombre' si existe
  }));
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
    // Si fecha es Date o string con hora, conviérte al formato
    let fechaParam: string;
    if (fecha.includes('T')) {
      fechaParam = fecha.split('T')[0];
    } else {
      fechaParam = fecha;
    }

    this.citaService.getHorasOcupadas(fechaParam, this.idEmpresa).subscribe({
      next: (horasOcupadas) => {
        this.filtrarHorasDisponibles(horasOcupadas || []);
      },
      error: (err) => {
        console.error('Error al cargar horas ocupadas:', err);
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

  /* Función para obtener la hora mínima permitida*/
  getMinHourForToday(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0); // redondear al inicio de la hora
  now.setHours(now.getHours() + 2); // +2 horas para evitar agendamiento urgente

  // Devuelve en formato "HH:mm"
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}


  // ─── Envío del Formulario ────────────────────────────────────────────────────

  /**
   * Envía el formulario de cita después de validar los campos.
   */
submitForm(): void {
  const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !this.userData.nombre?.trim() ||
    !this.userData.apellido?.trim() ||
    !this.userData.telefono?.trim() ||
    !this.userData.correo?.trim() ||
    !this.userData.hora?.trim() ||
    (this.userData.domicilio === 'si' && !this.userData.direccion?.trim())
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

  const direccion = this.userData.domicilio === 'si' ? this.userData.direccion : 'Tienda';

this.citaParaConfirmar = {
  nombre: this.userData.nombre,
  apellido: this.userData.apellido,
  telefono: this.userData.telefono,
  correo: this.userData.correo,
  domicilio: this.userData.domicilio,
  direccion: this.userData.domicilio === 'si' ? this.userData.direccion : 'Tienda',
  hora: this.userData.hora,
  fecha: this.selectedDate!,
  id_empresa: this.idEmpresa,
productos: this.normalizeProductos(),
  distancia_km: this.distancia_km || 0,
  costo_domicilio: this.costoDomicilio || 0,
  id_pago: +this.userData.id_pago,
  observaciones: this.userData.observaciones || '',
  metodo_envio: this.userData.metodoEnvioFactura || 'No especificado'
};

// Mostrar el modal
this.showConfirmation = true;

// Nombre legible de métodos
this.metodoPagoTexto = this.metodosPago.find(m => m.id_pago === +this.userData.id_pago)?.metodo || 'No especificado';
this.metodoEnvioTexto = this.userData.metodoEnvioFactura === 'correo' ? 'Correo electrónico' : this.userData.metodoEnvioFactura === 'sms' ? 'Mensaje de texto' : 'No especificado';

}
  // ─── Confirmar y Registrar la Cita ───────────────────────────────────────────
confirmAppointment(): void {
  console.log('Enviando cita al backend:', this.citaParaConfirmar);

  const citaObservable = this.citaIdParaEditar
    ? this.citaService.actualizarCita(this.citaIdParaEditar, this.citaParaConfirmar)
    : this.citaService.agendarCita(this.citaParaConfirmar);

  this.isSubmitting = true;

  citaObservable.subscribe({
    next: (response) => {
      this.toastr.success(
        this.citaIdParaEditar ? 'Cita actualizada exitosamente.' : 'Cita registrada exitosamente.',
        'Confirmación'
      );

      this.ticketGenerado = response.numero_ticket || '---';
      this.ticketConfirmado = true;
      this.resetForm();
      this.showConfirmation = false;
      this.isSubmitting = false;
        // Redirigir al componente formUser
      this.router.navigate(['/form-user'], {
        queryParams: {
          ticket: this.ticketGenerado,
          citaId: response.id_cita || null
        }
      });
    },
    error: (error) => {
      console.error('Error al guardar la cita:', error);
      this.toastr.error('No se pudo guardar la cita. Intenta nuevamente.', 'Error');
      this.isSubmitting = false;
    }
  });
}



  // ─── Productos de la Empresa ─────────────────────────────────────────────────

  /**
   * Carga los nombres de los productos seleccionados desde el backend.
   */
cargarNombresProductos(): void {
  const idEmpresa = +this.route.snapshot.queryParamMap.get('empresa')!;


  if (!idEmpresa) {
    console.warn('No se recibió id_empresa en parámetros');
    return;
  }

  console.log('ID Empresa:', idEmpresa);
  console.log('selectedProductIds:', this.selectedProductIds);

  this.apiService.getProductosPorEmpresa(idEmpresa).subscribe({
    next: (productos) => {
      this.productosSeleccionados = this.productosSeleccionados.map((seleccionado) => {
        const producto = productos.find(p => p.id_producto === seleccionado.id_producto);

        return {
          ...seleccionado,
          nombrep: producto?.nombre || 'Producto desconocido',
          precio: producto?.precio ?? 0
        };
      });
      // ACTUALIZA los IDs seleccionados (para enviar al backend)
this.selectedProductIds = this.productosSeleccionados.map(p => p.id_producto);


      this.valorProductos = this.productosSeleccionados.reduce(
        (sum, p) => sum + (p.precio * p.cantidad),
        0
      );

      this.actualizarTotal();
    },
  });
}

//Cargar la cita para modificar
private cargarCitaExistente(citaId: number): void {
  this.citaService.getCitaPorId(citaId).subscribe({
    next: (cita: Cita) => {
      this.userData = {
        nombre: cita.nombre,
        apellido: cita.apellido,
        telefono: cita.telefono,
        correo: cita.correo,
        domicilio: cita.domicilio,
        direccion: cita.direccion,
        distancia_km: cita.distancia_km || 0,
        hora: cita.hora,
        id_pago: String(cita.id_pago), // convertir a string si viene como número
        observaciones: cita.observaciones || '',
        metodoEnvioFactura: cita.metodo_envio || ''
      };

      this.selectedDate = cita.fecha;
      this.idEmpresa = cita.id_empresa ?? 0;
      this.empresaSeleccionada = ''; // puedes ajustar si tienes nombre

      this.productosSeleccionados = cita.productos.map((p) => ({
        id_producto: p.id_producto,
        cantidad: p.cantidad,
        nombrep: '',
        precio: 0
      }));

      this.cargarNombresProductos(); // carga nombre y precio

      if (cita.domicilio === 'si') {
        this.mapInitialized = false; // fuerza carga del mapa si es con domicilio
      }

      this.cargarHorasOcupadas(cita.fecha);
    },
    error: (err) => {
      console.error('Error al cargar cita existente:', err);
      this.toastr.error('No se pudo cargar la cita para editar.', 'Error');
    }
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
      distancia_km:0,
      hora: '',
      id_pago: '',
      observaciones:'',
      metodoEnvioFactura:''
    };
    this.citaParaConfirmar = undefined!;
  }

  
  /**Resetear el mapa */
  resetMapaDomicilio(): void {
    this.mapInitialized = false;
    this.map = undefined;
    this.marker = undefined;
    this.costoDomicilio = 0;
    this.distancia_km = 0;
    this.userData.direccion = '';

  }
/**
   * Reinicia los campos del valor domicilio y distancia Km.
   */
  
limpiarDatosDomicilio(): void {
  this.userData.direccion = '';
  this.userData.distancia_km = 0;
  this.userData.observaciones = '';
  this.costoDomicilio = 0;
}

onMetodoEntregaChange(): void {
 if (this.userData.domicilio === 'no') {
    this.userData.direccion = 'tienda'; // o '', si el backend lo prefiere vacío
    this.distancia_km = 0;
    this.costoDomicilio = 0;
    this.userData.observaciones = '';
    //   this.limpiarDatosDomicilio();
    // this.resetMapaDomicilio();
  } else if (this.userData.domicilio === 'si') {
    this.limpiarDatosDomicilio();
    this.resetMapaDomicilio();
    
  }

  this.actualizarTotal();
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
