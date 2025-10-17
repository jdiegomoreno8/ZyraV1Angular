//editar-cita.componente.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-editar-cita',
  templateUrl: './editar-cita.component.html',
  styleUrls: ['./editar-cita.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class EditarCitaComponent implements OnInit {
  citaForm!: FormGroup;
  citaOriginal: any = null;
  loading: boolean = false;
  mensaje: string = '';
  formModificado: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    // Inicializa el formulario con una estructura vacía para evitar errores de `formGroup`
    this.citaForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: [''],
      correo: [''],
      direccion: [''],
      domicilio: [''],
      fecha: [''],
      hora: [''],
      observaciones: [''],
      productos: this.fb.array([])
    });
  }

ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');

  if (!id) {
    this.router.navigate(['/']);
    return;
  }

  this.loading = true;

  this.apiService.getCitaPorId(+id).subscribe({
    next: (cita) => {
      this.loading = false;
      this.citaOriginal = cita;

      // Inicializa el formulario con la cita cargada
      this.citaForm = this.fb.group({
        nombre: [cita.nombre, Validators.required],
        apellido: [cita.apellido, Validators.required],
        telefono: [cita.telefono],
        correo: [cita.correo],
        direccion: [cita.direccion],
        domicilio: [cita.domicilio],
        fecha: [cita.fecha, Validators.required],
        hora: [cita.hora, Validators.required],
        observaciones: [cita.observaciones],
        productos: this.fb.array(
          (cita.productos || []).map((p: any) =>
            this.fb.group({
              nombre: [p.nombre, Validators.required],
              precio_unitario: [p.precio_unitario, [Validators.required, Validators.min(0)]],
            })
          )
        )
      });

      this.citaForm.valueChanges.subscribe(() => {
        this.formModificado = true;
      });

      this.calcularTotales();
    },
    error: (err) => {
      this.loading = false;
      console.error('Error al cargar cita:', err);
      this.router.navigate(['/']);
    }
  });
}


  get productos(): FormArray {
    return this.citaForm.get('productos') as FormArray;
  }

  agregarProducto() {
    this.productos.push(
      this.fb.group({
        nombre: ['', Validators.required],
        precio_unitario: [0, [Validators.required, Validators.min(0)]],
      })
    );
  }

  quitarProducto(index: number) {
    this.productos.removeAt(index);
    this.calcularTotales();
  }

  calcularTotales() {
    const productos = this.productos.value;
    const subtotal = productos.reduce((acc: number, p: any) => acc + +p.precio_unitario, 0);

    // Actualizamos campos no visibles en el formulario para total, etc. (opcional)
    this.citaForm.patchValue({
      // puedes tener campos ocultos en tu formulario si los necesitas
    }, { emitEvent: false });
  }

  guardarCambios() {
    if (this.citaForm.invalid) {
      this.mensaje = 'Completa todos los campos requeridos.';
      return;
    }

    this.loading = true;
    const datosModificados = {
      ...this.citaForm.value,
      cantidad_productos: this.productos.length,
      valor_productos: this.productos.value.reduce((sum: number, p: any) => sum + +p.precio_unitario, 0),
      total_pagar: this.citaForm.value.valor_productos + (this.citaOriginal?.costo_domicilio || 0),
    };

    this.apiService.modificarCita(this.citaOriginal.id, datosModificados).subscribe({
      next: () => {
        this.loading = false;
        this.mensaje = '✅ Cita modificada con éxito';
        this.formModificado = false;
        setTimeout(() => this.router.navigate(['/']), 2000);
      },
      error: (err) => {
        console.error('Error al modificar cita:', err);
        this.loading = false;
        this.mensaje = '❌ Error al guardar cambios';
      }
    });
  }
}
