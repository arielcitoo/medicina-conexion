import { ModalAsegurado } from '../modal-asegurado/modal-asegurado';
import { Component, OnInit, ViewChild, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepper, MatStepperModule, MatStep } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';// Asegúrate del nombre correcto
import { ExamenService } from '../../service/examen.service';
import { AuthService } from '../../service/auth.service';
import { Asegurado } from '../../interfaces/examen.interface';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-examen-preocupacional',
  imports: [
    CommonModule,
    MatStepperModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTooltipModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatStep
],
  standalone: true,
  templateUrl: './examen-preocupacional.html',
  styleUrl: './examen-preocupacional.css',
})
export class ExamenPreocupacional implements OnInit {


  @ViewChild('stepper') stepper!: MatStepper;


   // Inyección de dependencias con inject()
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
   private authService = inject(AuthService);
  private examenService = inject(ExamenService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  // Formularios para cada paso
  paso1Form: FormGroup;
  paso2Form: FormGroup;

   // Datos
  asegurados: Asegurado[] = [];
  archivosAsegurados: { [key: number]: { anverso: File | null, reverso: File | null } } = {};
  isLoading = false;
  imagenReciboPreview: string | null = null;



  // Columnas de la tabla
 readonly displayedColumns: string[] = [
  'nombre',
  'ci',
  'empresa', // Nueva columna
  'correo',
  'celular',
  'archivos',
  'acciones'
];



 // Avanzaar Paso 2
// Modifica el signal computado:
  puedeAvanzarPaso2(): boolean {
  const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value || 0;
  const cantidadActual = this.asegurados.length;

  console.log(` Validando paso 2: ${cantidadActual}/${cantidadPermitida} asegurados`);

  // 1. Verificar cantidad exacta
  if (cantidadActual !== cantidadPermitida) {
    console.log(` Cantidad: ${cantidadActual} ≠ ${cantidadPermitida}`);
    return false;
  }

  // 2. Verificar cada asegurado individualmente
  for (let i = 0; i < this.asegurados.length; i++) {
    const asegurado = this.asegurados[i];

    // Verificar contacto
    if (!asegurado.correoElectronico?.trim() || !asegurado.celular) {
      console.log(` Asegurado ${i+1} (${asegurado.nombreCompleto}) sin contacto completo`);
      console.log('   Correo:', asegurado.correoElectronico);
      console.log('   Celular:', asegurado.celular);
      return false;
    }

    // Verificar archivos
    const archivos = this.archivosAsegurados[asegurado.id!];
    if (!archivos?.anverso || !archivos?.reverso) {
      console.log(` Asegurado ${i+1} (${asegurado.nombreCompleto}) sin archivos completos`);
      console.log('   Anverso:', !!archivos?.anverso);
      console.log('   Reverso:', !!archivos?.reverso);
      return false;
    }
  }

  console.log(' TODAS las condiciones cumplidas para avanzar');
  return true;
}


 constructor() {
    // Paso 1: Datos del Recibo
    this.paso1Form = this.fb.group({
      numeroRecibo: ['', [Validators.required, Validators.pattern('^[0-9\\-]+$')]],
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
  }

  ngOnInit(): void {
    // Verificar si hay empresa verificada
    const empresa = this.authService.getEmpresaExamen();
    if (!empresa || !this.authService.puedeAccederExamen()) {
      // Redirigir al prelogin si no hay empresa verificada
      this.router.navigate(['/prelogin']);
      this.mostrarSnackbar('Debe verificar su empresa primero', 'error');
      return;
    }
     // Mostrar información de la empresa en consola
    console.log('🏢 Empresa verificada:', empresa);
    // Escuchar cambios en cantidad de asegurados
    this.paso1Form.get('cantidadAsegurados')?.valueChanges.subscribe(valor => {
      const aseguradosActuales = this.asegurados;
      if (aseguradosActuales.length > valor) {
        this.mostrarSnackbar(`Debe eliminar ${aseguradosActuales.length - valor} asegurados`);
      }
    });
// Opcional: limpiar datos de empresa después de finalizar
    this.authService.limpiarDatosExamen();
  }
 /**
   * Paso 2: Abrir modal para agregar asegurado - CORREGIDO
   */
  abrirModalAsegurado(): void {
  console.log(' Abriendo modal para agregar asegurado...');

  // Verificar límite de asegurados
  const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value || 0;
  if (this.asegurados.length >= cantidadPermitida) {
    this.mostrarSnackbar(`No puede agregar más de ${cantidadPermitida} asegurados`, 'error');
    return;
  }

  // IMPORTANTE: Crear una referencia a la modal y manejar el resultado inmediatamente
  const dialogRef = this.dialog.open(ModalAsegurado, {
    width: '700px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    disableClose: false,
    autoFocus: true,
    data: {
      maxAsegurados: cantidadPermitida - this.asegurados.length
    }
  });

  console.log(' Modal abierta');

  // SUSCRIBIRSE DIRECTAMENTE AL CIERRE - FORMA CORRECTA
  const subscription = dialogRef.afterClosed().subscribe({
    next: (result: Asegurado) => {
      console.log(' Resultado recibido de la modal:', result);

      if (result) {
        // AGREGAR INMEDIATAMENTE
        this.agregarAseguradoInmediatamente(result);
      } else {
        console.log(' Modal cerrada sin resultado');
      }

      // Limpiar suscripción
      subscription.unsubscribe();
    },
    error: (error) => {
      console.error(' Error al cerrar modal:', error);
      subscription.unsubscribe();
    }
  });
}


// NUEVO MÉTODO: Agregar asegurado inmediatamente después de cerrar la modal
private agregarAseguradoInmediatamente(asegurado: Asegurado): void {
  console.log(' Agregando asegurado #', this.asegurados.length + 1, asegurado);

  // Asignar ID único si no tiene (con timestamp + random para mayor seguridad)
  if (!asegurado.id) {
    asegurado.id = Date.now() + Math.floor(Math.random() * 10000);
    console.log(' Nuevo ID asignado:', asegurado.id);
  }

  // Verificar duplicados por CI
  const existe = this.asegurados.some(a => a.ci === asegurado.ci);
  if (existe) {
    this.mostrarSnackbar(`El asegurado con CI ${asegurado.ci} ya está en la lista`, 'error');
    return;
  }

  //  CAMBIO CRÍTICO: Crear NUEVA referencia del array (inmutabilidad)
  this.asegurados = [...this.asegurados, asegurado];

  console.log(' Lista actualizada:', {
    total: this.asegurados.length,
    ids: this.asegurados.map(a => a.id),
    nombres: this.asegurados.map(a => a.nombreCompleto)
  });

  // Inicializar archivos con nueva referencia del objeto
  this.archivosAsegurados = {
    ...this.archivosAsegurados,
    [asegurado.id]: {
      anverso: null,
      reverso: null
    }
  };

  console.log(' Archivos inicializados para ID', asegurado.id);

  // Actualizar formulario inmediatamente
  this.actualizarFormArrayAsegurados();

  // Mostrar notificación
  this.mostrarSnackbar(`Asegurado #${this.asegurados.length} "${asegurado.nombreCompleto}" agregado`, 'success');

  //  FORZAR DETECCIÓN DE CAMBIOS CON ChangeDetectorRef
  setTimeout(() => {
    this.cdRef.detectChanges();
    this.verificarEstadoActual();
  }, 100);
}
// Método para verificar estado actual
private verificarEstadoActual(): void {
  console.log(' ESTADO ACTUAL DEL COMPONENTE:');
  console.log(' Asegurados:', this.asegurados.length);
  console.log(' Lista completa:', this.asegurados);
  console.log(' Archivos por asegurado:', this.archivosAsegurados);
  console.log(' ¿Puede avanzar?', this.puedeAvanzarPaso2);
  console.log(' Formulario paso 2 válido:', this.paso2Form.valid);

  // Contar asegurados con archivos completos
  const conArchivos = this.asegurados.filter(a => {
    const archivos = this.archivosAsegurados[a.id!];
    return archivos?.anverso && archivos?.reverso;
  }).length;

  console.log(' Estadísticas:');
  console.log('  • Total asegurados:', this.asegurados.length);
  console.log('  • Con contacto completo:', this.contarAseguradosCompletos());
  console.log('  • Con archivos completos:', conArchivos);
}

// NUEVO MÉTODO: Forzar actualización de la UI
private forzarActualizacionUI(): void {
  console.log(' Forzando actualización de UI...');

  // Crear una nueva referencia del array para forzar detección de cambios
  this.asegurados = [...this.asegurados];

  // Actualizar formulario
  this.actualizarFormArrayAsegurados();

  // Forzar validación
  this.paso2Form.updateValueAndValidity();

  console.log(' UI actualizada. Estado:', {
    totalAsegurados: this.asegurados.length,
    puedeAvanzar: this.puedeAvanzarPaso2()
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

      // Asegurarnos de que el objeto para este asegurado existe
     this.archivosAsegurados = {
      ...this.archivosAsegurados,
      [aseguradoId]: {
        ...this.archivosAsegurados[aseguradoId],
        [tipo]: file
      }
    };

   console.log(` Archivo ${tipo} cargado para ID ${aseguradoId}:`, file.name);

     // Forzar detección de cambios
    setTimeout(() => {
      this.cdRef.detectChanges();
      console.log(' UI actualizada después de cargar archivo');
    }, 0);

    this.mostrarSnackbar(`Archivo ${tipo} cargado correctamente`);
  }
}


// Método para resetear completamente (opcional, para debug)
private resetearEstadoPaso2(): void {
  console.log(' Reseteando estado del paso 2...');

  // Crear nuevas referencias
  this.asegurados = [];
  this.archivosAsegurados = {};

  // Resetear formulario
  const formArray = this.paso2Form.get('aseguradosArray') as FormArray;
  formArray.clear();
  this.paso2Form.reset();

  // Forzar detección de cambios
  this.cdRef.detectChanges();

  console.log(' Estado reseteado');
}




  /**
   * Agregar asegurado a la lista
   */
  agregarAsegurado(asegurado: Asegurado): void {
  console.log(' Recibiendo asegurado desde modal:', asegurado);

  // Verificar límite de asegurados
  const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value;
  if (this.asegurados.length >= cantidadPermitida) {
    this.mostrarSnackbar(`No puede agregar más de ${cantidadPermitida} asegurados`, 'error');
    return;
  }

  // Asignar ID temporal si no tiene
  if (!asegurado.id) {
    asegurado.id = Date.now();
  }

  // Verificar que el asegurado no esté ya en la lista
  const existe = this.asegurados.some(a => a.ci === asegurado.ci);
  if (existe) {
    this.mostrarSnackbar('Este asegurado ya está en la lista', 'error');
    return;
  }

  // Agregar a la lista
  this.asegurados.push({ ...asegurado });

  // Inicializar archivos para este asegurado
  this.archivosAsegurados[asegurado.id] = {
    anverso: null,
    reverso: null
  };

  console.log(' Asegurado agregado:', {
    total: this.asegurados.length,
    asegurado: asegurado,
    archivosInicializados: this.archivosAsegurados[asegurado.id]
  });

  // Actualizar formulario
  this.actualizarFormArrayAsegurados();

  // Mostrar notificación
  this.mostrarSnackbar('Asegurado agregado correctamente', 'success');

  // Forzar actualización de la vista
  setTimeout(() => {
    console.log(' Vista actualizada');
    this.actualizarFormArrayAsegurados();
  }, 100);

   // Forzar actualización de la validación
  this.forzarActualizacionValidacion();
}

// En examen-preocupacional.ts, añade este método:
private forzarActualizacionValidacion(): void {
  // Forzar actualización de la validación
  console.log(' Forzando actualización de validación...');

  // Actualizar el formulario
  this.actualizarFormArrayAsegurados();

  // Emitir un cambio en el formulario para activar la validación
  this.paso2Form.updateValueAndValidity();

  console.log(' Validación forzada:', {
    puedeAvanzar: this.puedeAvanzarPaso2(),
    asegurados: this.asegurados.length,
    formularioValido: this.paso2Form.valid
  });
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

// En examen-preocupacional.ts
contarAseguradosCompletos(): number {
  return this.asegurados.filter(a =>
    a.correoElectronico && a.celular
  ).length;
}

contarAseguradosConArchivos(): number {
  return this.asegurados.filter(a =>
    this.archivosAsegurados[a.id!]?.anverso &&
    this.archivosAsegurados[a.id!]?.reverso
  ).length;
}


  /**
   * Verificar si un asegurado tiene archivos
   */
  tieneArchivosCompletos(aseguradoId: number): boolean {
    const archivos = this.archivosAsegurados[aseguradoId];
    return !!archivos?.anverso && !!archivos?.reverso;
  }

  /**
   * Actualizar formulario reactivo con asegurados
   */
  private actualizarFormArrayAsegurados(): void {
  console.log(' Actualizando formulario...');

  const formArray = this.paso2Form.get('aseguradosArray') as FormArray;

  //  CAMBIO: Usar formArray.clear() y reset() para limpiar completamente
  formArray.clear();

  // Pausa para asegurar limpieza
  setTimeout(() => {
    // Agregar cada asegurado con un nuevo grupo reactivo
    this.asegurados.forEach((asegurado, index) => {
      const grupo = this.fb.group({
        id: [asegurado.id],
        nombreCompleto: [asegurado.nombreCompleto, Validators.required],
        ci: [asegurado.ci, Validators.required],
        correo: [asegurado.correoElectronico, [Validators.required, Validators.email]],
        celular: [asegurado.celular, [Validators.required, Validators.pattern('^[0-9]{8}$')]],
        empresa: [asegurado.empresa || '']
      });

      formArray.push(grupo);
    });

    console.log(' Formulario actualizado con', formArray.length, 'asegurados');

    // Forzar validación
    this.paso2Form.updateValueAndValidity();
    this.paso2Form.markAsDirty();

    // Detectar cambios
    this.cdRef.detectChanges();
  }, 0);
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
