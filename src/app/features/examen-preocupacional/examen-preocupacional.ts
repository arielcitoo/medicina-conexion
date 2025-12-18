import { Component, OnInit, ViewChild, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray,ReactiveFormsModule  } from '@angular/forms';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalAsegurado } from '../modal-asegurado/modal-asegurado';
import { ExamenService } from '../../service/examen.service';
import { Asegurado } from '../../interfaces/examen.interface';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { MatFormField, MatLabel, MatError, MatHint } from "@angular/material/form-field";
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-examen-preocupacional',
  imports: [MatTooltipModule, MatTableModule, MatPaginatorModule, MatSortModule, ReactiveFormsModule, MatCard, MatCardHeader, MatCardTitle, MatIcon, MatCardSubtitle, MatCardContent, MatStepper, MatStep, MatFormField, MatLabel, MatError, MatHint, MatProgressSpinner],
  templateUrl: './examen-preocupacional.html',
  styleUrl: './examen-preocupacional.css',
})
export class ExamenPreocupacional implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Formularios para cada paso
  paso1Form: FormGroup;
  paso2Form: FormGroup;
  paso3Form: FormGroup;

  

  // Usando signals para reactividad
  asegurados: Asegurado[] = [];
    archivosAsegurados: { [key: number]: { anverso: File | null, reverso: File | null } } = {};

  isLoading = false;
  imagenReciboPreview: string | null = null;

  // Columnas de la tabla (constante)
  readonly displayedColumns: string[] = ['nombre', 'ci', 'correo', 'celular', 'archivos', 'acciones'];

  
  puedeAvanzarPaso2 = computed(() => {
    const aseguradosList = this.asegurados;
    if (aseguradosList.length === 0) return false;

    for (const asegurado of aseguradosList) {
      if (!asegurado.correoElectronico || !asegurado.celular) {
        return false;
      }
//archvi anverso ???
      const archivos = this.archivosAsegurados[asegurado.id];
      if (!archivos?.anverso || !archivos?.reverso) {
        return false;
      }
    }

    return this.paso2Form.valid && 
           aseguradosList.length === this.paso1Form.get('cantidadAsegurados')?.value;
  });

  textoBoton = computed(() => {
    if (this.isLoading) return 'Buscando...';
    if (this.asegurados.length > 0) return 'Ingresar al Sistema';
    return 'Buscar Empresa';
  });

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
      const aseguradosActuales = this.asegurados;
      if (aseguradosActuales.length > valor) {
        this.mostrarSnackbar(`Debe eliminar ${aseguradosActuales.length - valor} asegurados`);
      }
    });
  }

 /**
   * Paso 1: Manejo de imagen del recibo
   */
  onFileReciboSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.match('image/*') && !file.type.match('application/pdf')) {
        this.mostrarSnackbar('Solo se permiten imágenes o PDF');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarSnackbar('El archivo no debe superar los 5MB');
        return;
      }

      this.paso1Form.patchValue({ imagenRecibo: file });
      
      // Crear preview para imágenes
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

      this.archivosAsegurados[aseguradoId][tipo] = file;

      // Actualizar el asegurado con la URL temporal
      const index = this.asegurados.findIndex(a => a.id === aseguradoId);
      if (index !== -1) {
        if (tipo === 'anverso') {
          this.asegurados[index].formularioAnversoUrl = URL.createObjectURL(file);
        } else {
          this.asegurados[index].formularioReversoUrl = URL.createObjectURL(file);
        }
      }

      this.mostrarSnackbar(`Archivo ${tipo} cargado correctamente`);
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
    // Verificar límite de asegurados
    const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value;
    if (this.asegurados.length >= cantidadPermitida) {
      this.mostrarSnackbar(`No puede agregar más de ${cantidadPermitida} asegurados`);
      return;
    }

    // Asignar ID temporal
    asegurado.id = Date.now();
    this.asegurados.push({ ...asegurado });
    this.archivosAsegurados[asegurado.id] = { anverso: null, reverso: null };

    // Actualizar formulario
    this.actualizarFormArrayAsegurados();

    this.mostrarSnackbar('Asegurado agregado correctamente');
  }

   /**
   * Eliminar asegurado de la lista
   */
  eliminarAsegurado(id: number): void {
    this.asegurados = this.asegurados.filter(a => a.id !== id);
    delete this.archivosAsegurados[id];
    this.actualizarFormArrayAsegurados();
    this.mostrarSnackbar('Asegurado eliminado');
  }

 /**
   * Verificar si un asegurado tiene archivos
   */
 tieneArchivosCompletos(aseguradoId: number): boolean {
    return !!this.archivosAsegurados[aseguradoId]?.anverso && 
           !!this.archivosAsegurados[aseguradoId]?.reverso;
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
   * Mostrar notificaciones
   */
  private mostrarSnackbar(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`]
    });
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
      asegurados: this.asegurados.map(asegurado => ({
        ...asegurado,
        formularioGestoraAnverso: this.archivosAsegurados[asegurado.id!]?.anverso,
        formularioGestoraReverso: this.archivosAsegurados[asegurado.id!]?.reverso
      })),
      fechaRegistro: new Date()
    };

    this.examenService.guardarExamen(datosEnvio).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.mostrarSnackbar(response.mensaje, 'success');
        
        // Aquí podrías redirigir o resetear el formulario
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
    this.archivosAsegurados = {};
    this.imagenReciboPreview = null;
  }
  /**
   * Obtener nombre del archivo
   */
  getNombreArchivo(aseguradoId: number, tipo: 'anverso' | 'reverso'): string {
    const archivos = this.archivosAsegurados[aseguradoId];
    if (!archivos) return 'Sin archivo';

    const archivo = tipo === 'anverso' ? archivos.anverso : archivos.reverso;
    return archivo?.name || 'Sin archivo';
  }
}
