// editar-cita.component.ts
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CitaService } from '../../../services/cita.service';
import { ApiService } from '../../../services/api.service';
import { ToastrService } from 'ngx-toastr';
import { Empresa } from '../../../components/data/models/empresa.model';
import { Product } from '../../../components/data/models/product.model';

@Component({
  selector: 'app-editar-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-cita.component.html',
  styleUrls: ['./editar-cita.component.css']
})
export class EditarCitaComponent implements OnInit {
  citaForm!: FormGroup;
  citaId: number | null = null;
  empresaSeleccionada: Empresa | null = null;

  metodosPago: { id_pago: number; metodo: string }[] = [];
  productosDisponibles: Product[] = [];

  // MAPA DOMICILIO
  mapInitialized = false;
  map: google.maps.Map | undefined;
  marker: google.maps.Marker | undefined;
  costoDomicilio = 0;
  distancia_km = 0;

  horasDisponibles: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private citaService: CitaService,
    private apiService: ApiService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.citaForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      direccion: [''],
      domicilio: [''],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      id_pago: [null, Validators.required],
      id_empresa: [null, Validators.required],
      numero_ticket: [{ value: '', disabled: true }],
      distancia_km: [0],
      costo_domicilio: [0],
      valor_productos: [{ value: 0, disabled: true }],
      total_pagar: [{ value: 0, disabled: true }],
      observaciones: [''],
      productos: this.fb.array([])
    });

    const idParam = this.route.snapshot.queryParamMap.get('citaId');
    if (idParam && !isNaN(+idParam)) {
      this.citaId = +idParam;
      this.cargarCitaParaEditar(this.citaId);
    } else {
      this.toastr.error('El ID de la cita no es válido.', 'Error');
      this.router.navigate(['/']);
    }

    this.apiService.getMetodosPago().subscribe({
      next: (res) => (this.metodosPago = res),
      error: () => console.warn('No se pudieron cargar los métodos de pago')
    });
  }

  // ========================
  // Cargar cita
  // ========================
  private cargarCitaParaEditar(id: number) {
    this.citaService.getCitaPorId(id).subscribe({
      next: (cita: any) => {
        this.citaForm.patchValue({
          nombre: cita.nombre,
          apellido: cita.apellido,
          telefono: cita.telefono,
          correo: cita.correo,
          direccion: cita.direccion,
          domicilio: cita.domicilio,
          fecha: cita.fecha,
          hora: cita.hora,
          id_pago: cita.id_pago,
          id_empresa: cita.id_empresa,
          numero_ticket: cita.numero_ticket,
          distancia_km: cita.distancia_km,
          costo_domicilio: cita.costo_domicilio,
          valor_productos: cita.valor_productos,
          total_pagar: cita.total_pagar,
          observaciones: cita.observaciones
        });

        if (cita.domicilio === 'si') {
          this.initMapaDomicilio(cita.direccion);
        }

        if (cita.id_empresa) {
          this.apiService.getEmpresaPorId(cita.id_empresa).subscribe((empresa) => {
            this.empresaSeleccionada = empresa;
            this.cargarProductosPorEmpresa(empresa.id_empresa);
          });
        }

        this.cargarProductosAlFormulario(cita.productos || []);
      },
      error: () => {
        this.toastr.error('No se pudo cargar la cita', 'Error');
        this.router.navigate(['/']);
      }
    });
  }

  // ========================
  // MAPA Y DOMICILIO
  // ========================
initMapaDomicilio(direccion?: string) {
  if (!direccion) return;

  this.mapInitialized = true;
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ address: direccion }, (results, status) => {
    if (status === 'OK' && results && results[0]) {
      const location = results[0].geometry.location;

      const mapOptions = { center: location, zoom: 15 };
      this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, mapOptions);

      this.marker = new google.maps.Marker({
        position: location,
        map: this.map,
        draggable: true
      });

      // Calcular la distancia y costo inicial
      this.distancia_km = this.calcularDistancia(location.lat(), location.lng());
      this.costoDomicilio = this.calcularCostoDomicilio(this.distancia_km);
      this.citaForm.patchValue({
        distancia_km: this.distancia_km,
        costo_domicilio: this.costoDomicilio
      });
      this.recalcularTotales();

      // Actualizar al mover el marcador
      this.marker.addListener('dragend', () => {
        const pos = this.marker!.getPosition();
        if (pos) {
          this.distancia_km = this.calcularDistancia(pos.lat(), pos.lng());
          this.costoDomicilio = this.calcularCostoDomicilio(this.distancia_km);
          this.citaForm.patchValue({
            direccion: `${pos.lat()}, ${pos.lng()}`,
            distancia_km: this.distancia_km,
            costo_domicilio: this.costoDomicilio
          });
          this.recalcularTotales();
        }
      });
    } else {
      console.error('No se pudo geocodificar la dirección:', status);
      this.toastr.warning('Dirección no encontrada, revisa la información.');
    }
  });
}

  // ========================
  // CÁLCULO DE DOMICILIO
  // ========================
  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  calcularDistancia(lat: number, lng: number): number {
    const tiendaLat = this.empresaSeleccionada?.lat || -3.456; // reemplaza si no hay empresa
    const tiendaLng = this.empresaSeleccionada?.lng || -76.512;

    const R = 6371; // km
    const dLat = this.toRad(lat - tiendaLat);
    const dLng = this.toRad(lng - tiendaLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(tiendaLat)) *
      Math.cos(this.toRad(lat)) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  calcularCostoDomicilio(distancia: number): number {
    const tarifaBase = 5000;
    const costoPorKm = 1000;
    return tarifaBase + costoPorKm * distancia;
  }

  // ========================
  // PRODUCTOS
  // ========================
  private cargarProductosPorEmpresa(idEmpresa: number) {
    this.apiService.getProductosPorEmpresa(idEmpresa).subscribe({
      next: (productos) => (this.productosDisponibles = productos),
      error: () => console.warn('Error cargando productos')
    });
  }

  private cargarProductosAlFormulario(productos: any[]) {
    const productosForm = this.citaForm.get('productos') as FormArray;
    productosForm.clear();
    productos.forEach((prod) => {
      productosForm.push(
        this.fb.group({
          id_producto: [prod.id_producto, Validators.required],
          cantidad: [prod.cantidad, [Validators.required, Validators.min(1)]]
        })
      );
    });
    this.recalcularTotales();
  }

  get productosFormArray(): FormArray {
    return this.citaForm.get('productos') as FormArray;
  }

  agregarProducto() {
    if (!this.productosDisponibles.length) {
      this.toastr.warning('Primero selecciona una empresa para ver sus productos.', 'Aviso');
      return;
    }
    const nuevo = this.fb.group({
      id_producto: [this.productosDisponibles[0].id_producto, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    this.productosFormArray.push(nuevo);
    this.recalcularTotales();
  }

  eliminarProducto(index: number) {
    this.productosFormArray.removeAt(index);
    this.toastr.info('Producto eliminado', 'Aviso');
    this.recalcularTotales();
  }

  recalcularTotales() {
    let total = 0;
    const productos = this.productosFormArray.getRawValue();
    productos.forEach((p) => {
      const prodInfo = this.productosDisponibles.find((x) => x.id_producto === p.id_producto);
      const precio = prodInfo?.precio ?? 0;
      total += precio * (p.cantidad || 0);
    });
    const costoDomicilio = this.citaForm.get('costo_domicilio')?.value || 0;
    const totalPagar = total + costoDomicilio;
    this.citaForm.patchValue({
      valor_productos: total,
      total_pagar: totalPagar
    });
  }

  // ========================
  // HORAS DISPONIBLES
  // ========================
  cargarHorasOcupadas(fecha: string) {
    if (!fecha) return;
    this.citaService.getHorasOcupadas(fecha).subscribe({
      next: (ocupadas: string[]) => {
        const todasHoras = [
          '08:00', '09:00', '10:00', '11:00', '12:00',
          '13:00', '14:00', '15:00', '16:00', '17:00'
        ];
        this.horasDisponibles = todasHoras.filter(h => !ocupadas.includes(h));
      },
      error: () => {
        console.warn('No se pudieron cargar las horas ocupadas');
        this.horasDisponibles = [];
      }
    });
  }

  // ========================
  // GUARDAR
  // ========================
  guardarCambios() {
    if (this.citaForm.invalid || this.citaId === null) {
      this.toastr.warning('Completa todos los campos obligatorios.', 'Formulario incompleto');
      return;
    }

    const datosCita = this.citaForm.getRawValue();

    this.citaService.actualizarCita(this.citaId, datosCita).subscribe({
      next: () => {
        this.toastr.success('Cita actualizada correctamente.', 'Éxito');
        this.router.navigate(['/']);
      },
      error: () => {
        this.toastr.error('Error al actualizar la cita.', 'Error');
      }
    });
  }

onMetodoEntregaChange() {
  if (this.citaForm.value.domicilio === 'no') {
    this.citaForm.patchValue({
      direccion: 'tienda',
      distancia_km: 0,
      costo_domicilio: 0,
      observaciones: ''
    });
    this.mapInitialized = false;
    this.map = undefined;
    this.marker = undefined;
  } else if (this.citaForm.value.domicilio === 'si') {
    this.citaForm.patchValue({
      direccion: '',
      distancia_km: 0,
      costo_domicilio: 0,
      observaciones: ''
    });
    // Inicializa el mapa si hay una dirección previa
    if (this.citaForm.value.direccion) {
      this.initMapaDomicilio(this.citaForm.value.direccion);
    }
  }

  this.recalcularTotales();
}



// Getter para verificar si faltan dos horas para editar la cita
get editable() {
  if (!this.citaForm) return false; // aún no cargó el form
  const fecha = this.citaForm.get('fecha')?.value;
  const hora = this.citaForm.get('hora')?.value;

  if (!fecha || !hora) return true; // si no hay fecha u hora, permitimos editar

  const fechaHoraCita = new Date(`${fecha}T${hora}`);
  const ahora = new Date();
  const diffHoras = (fechaHoraCita.getTime() - ahora.getTime()) / (1000 * 60 * 60); // diferencia en horas

  return diffHoras >= 2; // editable solo si faltan 2+ horas
}




}