import { ModalAsegurado } from '../modal-asegurado/modal-asegurado';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray,  } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExamenService } from '../../service/examen.service';
import { EmpresaService } from '../../service/empresa.service';
import { Asegurado } from '../../interface/examen.interface';
import { ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ExamenExitoModal, ExitoModalData } from '../examen-exito-modal/examen-exito-modal';
import { SharedMaterialModule } from '../../shared/modules/material.module'; // Angular Material módulos compartidos

@Component({
  selector: 'app-examen-preocupacional',
  imports: [
    SharedMaterialModule,
    MatStep
],
  standalone: true,
  templateUrl: './examen-preocupacional.html',
  styleUrl: './examen-preocupacional.css',
})
export class ExamenPreocupacional implements OnInit {
  empresa: any = null;
  
  @ViewChild('stepper') stepper!: MatStepper;

  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private examenService = inject(ExamenService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  paso1Form: FormGroup;
  paso2Form: FormGroup;

  asegurados: Asegurado[] = [];
  archivosAsegurados: { [key: number]: { anverso: File | null, reverso: File | null } } = {};
  isLoading = false;
  imagenReciboPreview: string | null = null;
  
  idIngresoGenerado: string = '';
  fechaRegistro: Date | null = null;
  
  private cantidadAseguradosSubject = new Subject<number>();

  readonly displayedColumns: string[] = [
    'nombre',
    'ci',
    'correo',
    'celular',
    'archivos',
    'acciones'
  ];

  constructor(private empresaService: EmpresaService) {
    // Paso 1: Datos del Recibo con validación personalizada para la imagen
    this.paso1Form = this.fb.group({
      numeroRecibo: ['', [Validators.required, Validators.pattern('^[0-9\\-]+$')]],
      totalImporte: ['', [Validators.required, Validators.min(0)]],
      cantidadAsegurados: ['', [Validators.required, Validators.min(1)]],
      imagenRecibo: [null, [Validators.required]],
      correoEmpleador: ['', [Validators.email]],
      celularEmpleador: ['', [Validators.pattern('^[0-9]{8}$')]]
    });

    this.paso2Form = this.fb.group({
      aseguradosArray: this.fb.array([])
    });
  }

  ngOnInit(): void {
    console.log('Examen Preocupacional Component inicializado');
    
    this.empresa = this.empresaService.getEmpresaExamen();

    if (!this.empresa) {
      console.error(' No existe empresa verificada');
      this.router.navigate(['/prelogin']);
      this.mostrarSnackbar('Debe verificar su empresa primero', 'error');
      return;
    }
    
    console.log(' Empresa en examen:', this.empresa.razonSocial);
    
    this.idIngresoGenerado = this.generarIdIngreso();
    
    this.setupCantidadAseguradosSubscription();
    
    this.paso1Form.get('cantidadAsegurados')?.valueChanges.subscribe(valor => {
      this.cantidadAseguradosSubject.next(valor);
      const aseguradosActuales = this.asegurados;
      if (aseguradosActuales.length > valor) {
        this.mostrarSnackbar(`Debe eliminar ${aseguradosActuales.length - valor} asegurados`);
      }
    });

    const cantidadInicial = this.paso1Form.get('cantidadAsegurados')?.value || 1;
    this.actualizarValidacionesPaso1(cantidadInicial);
  }

  /**
   * Generar ID de ingreso único
   */
  private generarIdIngreso(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const empresaId = this.empresa?.id?.toString().substr(0, 4) || '0000';
    return `ING-${empresaId}-${timestamp}-${random}`;
  }

  /**
   * Formatear fecha para usar en el template
   */
  formatearFecha(fecha: Date | null): string {
    if (!fecha) return '';
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  }

  /**
   * Formatear número con 2 decimales
   */
  formatNumber(numero: number | string): string {
    const num = typeof numero === 'string' ? parseFloat(numero) : numero;
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  }

  /**
   * Configurar suscripción para cambios en cantidad de asegurados
   */
  private setupCantidadAseguradosSubscription(): void {
    this.cantidadAseguradosSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((cantidad: number) => {
      console.log('Cambio en cantidad de asegurados:', cantidad);
      this.actualizarValidacionesPaso1(cantidad);
    });
  }

  /**
   * Actualizar validaciones del paso 1 según cantidad de asegurados
   */
  private actualizarValidacionesPaso1(cantidad: number): void {
    const correoControl = this.paso1Form.get('correoEmpleador');
    const celularControl = this.paso1Form.get('celularEmpleador');

    if (cantidad > 1) {
      correoControl?.setValidators([Validators.required, Validators.email]);
      celularControl?.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$')]);
    } else {
      correoControl?.setValidators([Validators.email]);
      celularControl?.setValidators([Validators.pattern('^[0-9]{8}$')]);
      
      if (correoControl?.value) {
        correoControl.setValue('');
      }
      if (celularControl?.value) {
        celularControl.setValue('');
      }
    }

    correoControl?.updateValueAndValidity();
    celularControl?.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  /**
   * Verificar si puede avanzar al paso 2
   */
  puedeAvanzarPaso2(): boolean {
    const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value || 0;
    const cantidadActual = this.asegurados.length;

    if (cantidadActual !== cantidadPermitida) {
      return false;
    }

    for (let i = 0; i < this.asegurados.length; i++) {
      const asegurado = this.asegurados[i];

      if (!asegurado.correoElectronico?.trim() || !asegurado.celular) {
        return false;
      }

      const archivos = this.archivosAsegurados[asegurado.id!];
      if (!archivos?.anverso || !archivos?.reverso) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verificar si puede avanzar al paso 1
   */
  puedeAvanzarPaso1(): boolean {
    const esValido = (controlName: string): boolean => {
      const control = this.paso1Form.get(controlName);
      return control ? control.valid : false;
    };

    const tieneValor = (controlName: string): boolean => {
      const control = this.paso1Form.get(controlName);
      return control ? !!control.value : false;
    };

    // Campos básicos obligatorios siempre
    if (!esValido('numeroRecibo') || !esValido('totalImporte') || 
        !esValido('cantidadAsegurados') || !esValido('imagenRecibo')) {
      return false;
    }

    const cantidad = this.paso1Form.get('cantidadAsegurados')?.value || 0;
    
    if (cantidad > 1) {
      return esValido('correoEmpleador') && esValido('celularEmpleador');
    }
    
    const correoValido = !tieneValor('correoEmpleador') || esValido('correoEmpleador');
    const celularValido = !tieneValor('celularEmpleador') || esValido('celularEmpleador');
    
    return correoValido && celularValido;
  }

  /**
   * Obtener mensaje de validación para correo
   */
  getCorreoErrorMessage(): string {
    const control = this.paso1Form.get('correoEmpleador');
    const cantidad = this.paso1Form.get('cantidadAsegurados')?.value;
    
    if (control?.hasError('required') && cantidad > 1) {
      return 'El correo es obligatorio cuando hay más de un asegurado';
    }
    
    if (control?.hasError('email')) {
      return 'Ingrese un correo válido';
    }
    
    return '';
  }

  /**
   * Obtener mensaje de validación para celular
   */
  getCelularErrorMessage(): string {
    const control = this.paso1Form.get('celularEmpleador');
    const cantidad = this.paso1Form.get('cantidadAsegurados')?.value;
    
    if (control?.hasError('required') && cantidad > 1) {
      return 'El celular es obligatorio cuando hay más de un asegurado';
    }
    
    if (control?.hasError('pattern')) {
      return 'Ingrese 8 dígitos';
    }
    
    return '';
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
    this.fechaRegistro = new Date();

    // Preparar datos para enviar al backend
    const datosEnvio = this.prepararDatosParaBackend();

    console.log('Enviando datos al backend:', datosEnvio);

    // Simulación de llamada al backend
    setTimeout(() => {
      this.isLoading = false;
      this.mostrarModalExito();
    }, 1500);
  }

  /**
   * Mostrar modal de éxito
   */
  private mostrarModalExito(): void {
    const modalData: ExitoModalData = {
      idIngreso: this.idIngresoGenerado,
      fechaRegistro: this.fechaRegistro!,
      numeroRecibo: this.paso1Form.get('numeroRecibo')?.value,
      totalAsegurados: this.asegurados.length,
      importeTotal: parseFloat(this.paso1Form.get('totalImporte')?.value) || 0,
      empresa: {
        razonSocial: this.empresa.razonSocial,
        nit: this.empresa.nit || this.empresa.NIT || '',
        numeroPatronal: this.empresa.nroPatronal || this.empresa.numeroPatronal || ''
      }
    };

    const dialogRef = this.dialog.open(ExamenExitoModal, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'descargar') {
        this.descargarComprobantePDF();
      } else if (result?.action === 'salir') {
        this.volverAlInicio();
      }
    });
  }

  /**
   * Descargar comprobante PDF
   */
  private descargarComprobantePDF(): void {
    this.mostrarSnackbar('Generando PDF...', 'info');
    
    // Crear contenido del PDF (simulado)
    const contenido = `
      COMPROBANTE DE REGISTRO - EXAMEN PREOCUPACIONAL
      ================================================
      
      ID de Registro: ${this.idIngresoGenerado}
      Fecha de Registro: ${this.formatearFecha(this.fechaRegistro)}
      
      DATOS DE LA EMPRESA
      -------------------
      Razón Social: ${this.empresa?.razonSocial}
      NIT: ${this.empresa?.nit || this.empresa?.NIT || ''}
      Número Patronal: ${this.empresa?.nroPatronal || this.empresa?.numeroPatronal || ''}
      
      DATOS DEL RECIBO
      ----------------
      Número de Recibo: ${this.paso1Form.get('numeroRecibo')?.value}
      Total Importe: Bs. ${this.formatNumber(this.paso1Form.get('totalImporte')?.value)}
      Cantidad de Asegurados: ${this.asegurados.length}
      
      ${
        this.paso1Form.get('cantidadAsegurados')?.value > 1 
          ? `Correo Empleador: ${this.paso1Form.get('correoEmpleador')?.value}
      Celular Empleador: ${this.paso1Form.get('celularEmpleador')?.value}`
          : ''
      }
      
      ASEGURADOS REGISTRADOS
      ----------------------
      ${this.asegurados.map((asegurado, i) => `
      ${i + 1}. ${asegurado.nombreCompleto}
         CI/NIT: ${asegurado.ci}
         Correo: ${asegurado.correoElectronico}
         Celular: ${asegurado.celular}
      `).join('\n')}
      
      ---------------------------------
      Sistema CNS - Caja Nacional de Salud
      ${new Date().toLocaleDateString()}
    `;

    // Crear y descargar archivo (simulación de PDF)
    const blob = new Blob([contenido], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-${this.idIngresoGenerado}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.mostrarSnackbar('PDF descargado correctamente', 'success');
  }

  /**
   * Preparar datos para enviar al backend
   */
  private prepararDatosParaBackend(): any {
    return {
      // Información del registro
      idIngreso: this.idIngresoGenerado,
      fechaRegistro: this.fechaRegistro,
      estado: 'REGISTRADO',
      
      // Información de la empresa
      empresa: {
        id: this.empresa.id,
        razonSocial: this.empresa.razonSocial,
        nit: this.empresa.nit,
        numeroPatronal: this.empresa.nroPatronal || this.empresa.numeroPatronal,
        telefono: this.empresa.telefono,
        direccion: this.empresa.direccion,
        estado: this.empresa.estado
      },
      
      // Datos del recibo
      recibo: {
        numeroRecibo: this.paso1Form.get('numeroRecibo')?.value,
        totalImporte: this.paso1Form.get('totalImporte')?.value,
        cantidadAsegurados: this.paso1Form.get('cantidadAsegurados')?.value,
        imagenRecibo: {
          nombre: this.paso1Form.get('imagenRecibo')?.value?.name,
          tipo: this.paso1Form.get('imagenRecibo')?.value?.type,
          tamaño: this.paso1Form.get('imagenRecibo')?.value?.size
        },
        correoEmpleador: this.paso1Form.get('correoEmpleador')?.value,
        celularEmpleador: this.paso1Form.get('celularEmpleador')?.value
      },
      
      // Lista de asegurados
      asegurados: this.asegurados.map(asegurado => {
        const archivos = this.archivosAsegurados[asegurado.id!];
        
        return {
          id: asegurado.id,
          nombreCompleto: asegurado.nombreCompleto,
          ci: asegurado.ci,
          fechaNacimiento: asegurado.fechaNacimiento,
          correoElectronico: asegurado.correoElectronico,
          celular: asegurado.celular,
          empresa: asegurado.empresa,
          genero: asegurado.genero,
          formularioGestora: {
            anverso: archivos?.anverso ? {
              nombre: archivos.anverso.name,
              tipo: archivos.anverso.type,
              tamaño: archivos.anverso.size
            } : null,
            reverso: archivos?.reverso ? {
              nombre: archivos.reverso.name,
              tipo: archivos.reverso.type,
              tamaño: archivos.reverso.size
            } : null
          }
        };
      }),
      
      // Metadatos
      metadata: {
        usuario: 'system',
        ip: '127.0.0.1',
        userAgent: navigator.userAgent,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Volver al inicio
   */
  volverAlInicio(): void {
    this.router.navigate(['/prelogin']);
  }

  /**
   * Paso 1: Manejo de imagen del recibo (modificado)
   */
  onFileReciboSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const esTipoValido = file.type.match('image/*') || file.type.match('application/pdf');
      const esTamañoValido = file.size <= 5 * 1024 * 1024; // 5MB

      if (!esTipoValido) {
        this.mostrarSnackbar('Solo se permiten imágenes (JPG, PNG) o PDF', 'error');
        this.paso1Form.get('imagenRecibo')?.setErrors({ fileType: true });
        return;
      }

      if (!esTamañoValido) {
        this.mostrarSnackbar('El archivo no debe superar los 5MB', 'error');
        this.paso1Form.get('imagenRecibo')?.setErrors({ maxSize: true });
        return;
      }

      // Limpiar errores
      this.paso1Form.get('imagenRecibo')?.setErrors(null);
      this.paso1Form.patchValue({ imagenRecibo: file });

      // Crear preview para imágenes
      if (file.type.match('image/*')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagenReciboPreview = reader.result as string;
          this.cdRef.detectChanges();
        };
        reader.readAsDataURL(file);
      } else {
        this.imagenReciboPreview = null;
      }

      this.mostrarSnackbar('Archivo cargado correctamente', 'success');
      this.paso1Form.get('imagenRecibo')?.updateValueAndValidity();
      this.cdRef.detectChanges();
    }
  }

  /**
   * Eliminar imagen del recibo
   */
  eliminarImagenRecibo(): void {
    this.paso1Form.patchValue({ imagenRecibo: null });
    this.imagenReciboPreview = null;
    this.paso1Form.get('imagenRecibo')?.setErrors({ required: true });
    this.mostrarSnackbar('Imagen del recibo eliminada', 'info');
    this.cdRef.detectChanges();
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

      this.archivosAsegurados = {
        ...this.archivosAsegurados,
        [aseguradoId]: {
          ...this.archivosAsegurados[aseguradoId],
          [tipo]: file
        }
      };

      this.mostrarSnackbar(`Archivo ${tipo} cargado correctamente`);
      this.cdRef.detectChanges();
    }
  }

  /**
   * Abrir modal para agregar asegurado
   */
  abrirModalAsegurado(): void {
    const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value || 0;
    if (this.asegurados.length >= cantidadPermitida) {
      this.mostrarSnackbar(`No puede agregar más de ${cantidadPermitida} asegurados`, 'error');
      return;
    }

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

    const subscription = dialogRef.afterClosed().subscribe({
      next: (result: Asegurado) => {
        if (result) {
          this.agregarAseguradoInmediatamente(result);
        }
        subscription.unsubscribe();
      },
      error: (error) => {
        console.error(' Error al cerrar modal:', error);
        subscription.unsubscribe();
      }
    });
  }

  /**
   * Agregar asegurado inmediatamente
   */
  private agregarAseguradoInmediatamente(asegurado: Asegurado): void {
    if (!asegurado.id) {
      asegurado.id = Date.now() + Math.floor(Math.random() * 10000);
    }

    const existe = this.asegurados.some(a => a.ci === asegurado.ci);
    if (existe) {
      this.mostrarSnackbar(`El asegurado con CI ${asegurado.ci} ya está en la lista`, 'error');
      return;
    }

    this.asegurados = [...this.asegurados, asegurado];

    this.archivosAsegurados = {
      ...this.archivosAsegurados,
      [asegurado.id]: {
        anverso: null,
        reverso: null
      }
    };

    this.actualizarFormArrayAsegurados();
    this.mostrarSnackbar(`Asegurado #${this.asegurados.length} "${asegurado.nombreCompleto}" agregado`, 'success');
    this.cdRef.detectChanges();
  }

  /**
   * Eliminar asegurado de la lista
   */
  eliminarAsegurado(id: number): void {
    this.asegurados = this.asegurados.filter(a => a.id !== id);
    delete this.archivosAsegurados[id];
    this.actualizarFormArrayAsegurados();
    this.mostrarSnackbar('Asegurado eliminado');
    this.cdRef.detectChanges();
  }

  /**
   * Contar asegurados con contacto completo
   */
  contarAseguradosCompletos(): number {
    return this.asegurados.filter(a =>
      a.correoElectronico && a.celular
    ).length;
  }

  /**
   * Contar asegurados con archivos completos
   */
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
   * Obtener nombre del archivo
   */
  getNombreArchivo(aseguradoId: number, tipo: 'anverso' | 'reverso'): string {
    const archivos = this.archivosAsegurados[aseguradoId];
    if (!archivos) return 'Sin archivo';

    const archivo = tipo === 'anverso' ? archivos.anverso : archivos.reverso;
    return archivo?.name || 'Sin archivo';
  }

  /**
   * Actualizar formulario reactivo con asegurados
   */
  private actualizarFormArrayAsegurados(): void {
    const formArray = this.paso2Form.get('aseguradosArray') as FormArray;
    formArray.clear();

    this.asegurados.forEach((asegurado) => {
      const grupo = this.fb.group({
        id: [asegurado.id],
        nombreCompleto: [asegurado.nombreCompleto, Validators.required],
        ci: [asegurado.ci, Validators.required],
        correo: [asegurado.correoElectronico, [Validators.required, Validators.email]],
        celular: [asegurado.celular, [Validators.required, Validators.pattern('^[0-9]{8}$')]]
      });

      formArray.push(grupo);
    });

    this.paso2Form.updateValueAndValidity();
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
   * Resetear formulario completo
   */
  private resetearFormulario(): void {
    this.stepper.reset();
    this.paso1Form.reset();
    this.paso2Form.reset();
    this.asegurados = [];
    this.archivosAsegurados = {};
    this.imagenReciboPreview = null;
    this.idIngresoGenerado = this.generarIdIngreso();
    this.cdRef.detectChanges();
  }
}