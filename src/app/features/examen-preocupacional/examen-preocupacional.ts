import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalAsegurado} from '../modal-asegurado/modal-asegurado';
import { ExamenService } from '../../service/examen.service';
import { Asegurado } from '../../interfaces/examen.interface';

// Angular Material Modules
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';


@Component({
  selector: 'app-examen-preocupacional',
  imports: [CommonModule,

    ReactiveFormsModule,
    FormsModule,


    // Angular Material Modules
    MatProgressSpinnerModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule],
  templateUrl: './examen-preocupacional.html',
  styleUrl: './examen-preocupacional.css',
})
export class ExamenPreocupacional implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Formularios para cada paso
  paso1Form: FormGroup;
  paso2Form: FormGroup;
  paso3Form: FormGroup;

  // Variables para el paso 2
  asegurados: Asegurado[] = [];
  displayedColumns: string[] = ['nombre', 'ci', 'correo', 'celular', 'archivos', 'acciones'];
  archivosAsegurados: Map<number, { anverso: File | null, reverso: File | null }> = new Map();

  // Variables de estado
  isLoading = false;
  imagenReciboPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private examenService: ExamenService,
    private snackBar: MatSnackBar
  ) {
    // Paso 1: Datos del Recibo
    this.paso1Form = this.fb.group({
      numeroRecibo: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      totalImporte: ['', [Validators.required, Validators.min(0)]],
      cantidadAsegurados: ['', [Validators.required, Validators.min(1)]],
      imagenRecibo: [null],
      correoEmpleador: ['', [Validators.required, Validators.email]],
      celularEmpleador: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });

    // Paso 2: Lista de asegurados
    this.paso2Form = this.fb.group({
      aseguradosArray: this.fb.array([])
    });

    // Paso 3: Resumen
    this.paso3Form = this.fb.group({});
  }

  ngOnInit(): void {
    // Escuchar cambios en cantidad de asegurados
    this.paso1Form.get('cantidadAsegurados')?.valueChanges.subscribe(valor => {
      if (this.asegurados.length > valor) {
        this.mostrarSnackbar(`Debe eliminar ${this.asegurados.length - valor} asegurados`);
      }
    });
  }

  /**
   * Paso 1: Manejo de imagen del recibo
   */
  onFileReciboSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match('image/*') && !file.type.match('application/pdf')) {
        this.mostrarSnackbar('Solo se permiten imágenes o PDF');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.mostrarSnackbar('El archivo no debe superar los 5MB');
        return;
      }

      this.paso1Form.patchValue({ imagenRecibo: file });

      if (file.type.match('image/*')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagenReciboPreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.imagenReciboPreview = null;
      }

      this.paso1Form.get('imagenRecibo')?.updateValueAndValidity();
    }
  }

  /**
   * Paso 2: Abrir modal para agregar asegurado
   */
  abrirModalAsegurado(): void {
    const dialogRef = this.dialog.open(ModalAsegurado, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: Asegurado) => {
      if (result) {
        this.agregarAsegurado(result);
      }
    });
  }

  /**
   * Agregar asegurado a la lista
   */
  agregarAsegurado(asegurado: Asegurado): void {
    const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value;
    if (this.asegurados.length >= cantidadPermitida) {
      this.mostrarSnackbar(`No puede agregar más de ${cantidadPermitida} asegurados`);
      return;
    }

    // Asegurar que el asegurado tenga un ID
    if (!asegurado.id) {
      asegurado.id = Date.now(); // ID temporal si no viene del modal
    }

    this.asegurados.push({ ...asegurado });
    this.archivosAsegurados.set(asegurado.id, { anverso: null, reverso: null });

    this.actualizarFormArrayAsegurados();
    this.mostrarSnackbar('Asegurado agregado correctamente');
  }

  /**
   * Eliminar asegurado de la lista
   */
  eliminarAsegurado(id: number): void {
    this.asegurados = this.asegurados.filter(a => a.id !== id);
    this.archivosAsegurados.delete(id);
    this.actualizarFormArrayAsegurados();
    this.mostrarSnackbar('Asegurado eliminado');
  }

  /**
   * Manejar archivos del formulario gestora
   */
  onFileGestoraSelected(event: any, aseguradoId: number, tipo: 'anverso' | 'reverso'): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match('image/*') && !file.type.match('application/pdf')) {
        this.mostrarSnackbar('Solo se permiten imágenes o PDF');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.mostrarSnackbar('El archivo no debe superar los 5MB');
        return;
      }

      const archivos = this.archivosAsegurados.get(aseguradoId);
      if (archivos) {
        if (tipo === 'anverso') {
          archivos.anverso = file;
        } else {
          archivos.reverso = file;
        }
        this.archivosAsegurados.set(aseguradoId, archivos);
      } else {
        // Si no existe la entrada, crear una nueva
        const nuevosArchivos = tipo === 'anverso'
          ? { anverso: file, reverso: null }
          : { anverso: null, reverso: file };
        this.archivosAsegurados.set(aseguradoId, nuevosArchivos);
      }

      // Actualizar URL temporal
      const index = this.asegurados.findIndex(a => a.id === aseguradoId);
      if (index !== -1) {
        const url = URL.createObjectURL(file);
        if (tipo === 'anverso') {
          this.asegurados[index].formularioAnversoUrl = url;
        } else {
          this.asegurados[index].formularioReversoUrl = url;
        }
      }

      this.mostrarSnackbar(`Archivo ${tipo} cargado correctamente`);
    }
  }

  /**
   * Actualizar formulario reactivo con asegurados
   */
  private actualizarFormArrayAsegurados(): void {
    const formArray = this.paso2Form.get('aseguradosArray') as FormArray;
    formArray.clear();
    this.asegurados.forEach(asegurado => {
      formArray.push(this.fb.group({
        id: [asegurado.id],
        nombreCompleto: [asegurado.nombreCompleto, Validators.required],
        ci: [asegurado.ci, Validators.required],
        correo: [asegurado.correoElectronico, [Validators.required, Validators.email]],
        celular: [asegurado.celular, [Validators.required, Validators.pattern('^[0-9]{8}$')]]
      }));
    });
  }

  /**
   * Validar si se puede avanzar al siguiente paso - CORREGIDO
   */
  puedeAvanzarPaso1(): boolean {
    return this.paso1Form.valid;
  }

  puedeAvanzarPaso2(): boolean {
    if (this.asegurados.length === 0) return false;

    // Verificar que todos los asegurados tengan datos
    for (const asegurado of this.asegurados) {
      if (!asegurado.correoElectronico || !asegurado.celular) {
        return false;
      }

      // Usar Map.get() que es seguro
      const archivos = this.archivosAsegurados.get(asegurado.id);
      if (!archivos?.anverso || !archivos?.reverso) {
        return false;
      }
    }

    return this.paso2Form.valid &&
           this.asegurados.length === this.paso1Form.get('cantidadAsegurados')?.value;
  }

  /**
   * Paso 3: Finalizar y guardar
   */
  finalizarRegistro(): void {
    if (!this.puedeAvanzarPaso2()) {
      this.mostrarSnackbar('Complete todos los datos requeridos');
      return;
    }

    this.isLoading = true;

    // Preparar datos para enviar
    const datosEnvio = {
      recibo: {
        ...this.paso1Form.value,
        imagenRecibo: this.paso1Form.get('imagenRecibo')?.value
      },
      asegurados: this.asegurados.map(asegurado => {
        const archivos = this.archivosAsegurados.get(asegurado.id);
        return {
          ...asegurado,
          formularioGestoraAnverso: archivos?.anverso || null,
          formularioGestoraReverso: archivos?.reverso || null
        };
      }),
      fechaRegistro: new Date()
    };

    this.examenService.guardarExamen(datosEnvio).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.mostrarSnackbar(response.mensaje, 'success');

        setTimeout(() => {
          this.resetearFormulario();
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.mostrarSnackbar('Error al guardar el registro', 'error');
        console.error('Error:', error);
      }
    });
  }

  /**
   * Resetear formulario completo
   */
  resetearFormulario(): void {
    this.stepper.reset();
    this.paso1Form.reset();
    this.paso2Form.reset();
    this.asegurados = [];
    this.archivosAsegurados.clear();
    this.imagenReciboPreview = null;
  }

  /**
   * Mostrar notificaciones
   */
  private mostrarSnackbar(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`]
    });
  }

  /**
   * Obtener archivos de un asegurado
   */
  getArchivosAsegurado(id: number): { anverso: File | null, reverso: File | null } | undefined {
    return this.archivosAsegurados.get(id);
  }

  /**
   * Verificar si un asegurado tiene archivos
   */
  tieneArchivosCompletos(aseguradoId: number): boolean {
    const archivos = this.archivosAsegurados.get(aseguradoId);
    return !!archivos?.anverso && !!archivos?.reverso;
  }

  /**
   * Obtener nombre del archivo
   */
  getNombreArchivo(aseguradoId: number, tipo: 'anverso' | 'reverso'): string {
    const archivos = this.archivosAsegurados.get(aseguradoId);
    if (!archivos) return 'Sin archivo';

    const archivo = tipo === 'anverso' ? archivos.anverso : archivos.reverso;
    return archivo?.name || 'Sin archivo';
  }
}
