import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SesionService } from '../../../../core/service/sesion.service';
import { EmpresaService } from '../../../../core/service/empresa.service';
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatHint, MatError, MatFormField, MatLabel } from "@angular/material/form-field";
import { SharedMaterialModule } from '../../../../shared/modules/material.module'; // angular Material módulos compartidos



@Component({
  selector: 'app-login',
  imports: [
    SharedMaterialModule,
    MatIcon, 
    MatProgressSpinner, 
    MatHint, 
    MatError, 
    MatFormField, 
    MatLabel,
    ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm: FormGroup;
  accesoForm: FormGroup;
  modo: 'nuevo' | 'recuperar' = 'nuevo';
  isLoading = false;
  mensajeError = '';
  idEjemploGenerado: boolean = false;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sesionService: SesionService,
    private empresaService: EmpresaService
  ) {
    this.loginForm = this.fb.group({
      aceptarTerminos: [false, Validators.requiredTrue]
    });

    this.accesoForm = this.fb.group({
      idAcceso: ['', [
        Validators.required,
        Validators.pattern(/^EXM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i)
      ]]
    });
  }

  ngOnInit(): void {
    // Verificar si ya hay una sesión activa
    const idAcceso = this.sesionService.getIdAcceso();
    if (idAcceso ) {
      // Redirigir directamente según el paso actual
      const sesionRecuperada = this.sesionService.recuperarSesion(idAcceso);
       if (sesionRecuperada) {
      this.redirigirSegunPaso();
      }
    }
  }
  /**
   * MÉTODO onIdInput - Maneja el evento input en el campo ID
   */
  onIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    console.log('📝 Input detectado:', value);
    
    // 1. Convertir a mayúsculas
    value = value.toUpperCase();
    
    // 2. Remover caracteres no permitidos (solo A-Z, 0-9, guión)
    value = value.replace(/[^A-Z0-9-]/g, '');
    
    // 3. Autoformatear mientras escribe
    value = this.formatearIdMientrasEscribe(value);
    
    // 4. Limitar longitud máxima (EXM-XXXX-XXXX-XXXX = 18 caracteres)
    if (value.length > 18) {
      value = value.substring(0, 18);
    }
    
    // 5. Actualizar el valor en el formulario
    if (value !== this.accesoForm.get('idAcceso')?.value) {
      this.accesoForm.patchValue({ idAcceso: value }, { emitEvent: false });
      
      // Limpiar mensaje de ejemplo si el usuario empieza a escribir
      if (value.length > 0 && this.idEjemploGenerado) {
        this.idEjemploGenerado = false;
      }
    }
  }

/**
   * Formatea el ID mientras el usuario escribe
   */
  private formatearIdMientrasEscribe(valor: string): string {
    // Si no empieza con EXM, forzarlo
    if (!valor.startsWith('EXM')) {
      if (valor.length > 0 && !valor.includes('EXM')) {
        valor = 'EXM' + valor;
      }
    }
    
    let formateado = valor;
    
    // Insertar guiones en posiciones específicas
    // Formato: EXM-XXXX-XXXX-XXXX
    // Posiciones: 3, 8, 13
    
    if (formateado.length > 3 && formateado.charAt(3) !== '-') {
      formateado = formateado.slice(0, 3) + '-' + formateado.slice(3);
    }
    
    if (formateado.length > 8 && formateado.charAt(8) !== '-') {
      formateado = formateado.slice(0, 8) + '-' + formateado.slice(8);
    }
    
    if (formateado.length > 13 && formateado.charAt(13) !== '-') {
      formateado = formateado.slice(0, 13) + '-' + formateado.slice(13);
    }
    
    return formateado;
  }
  /**
   * Acceso nuevo - Comenzar
   */
  comenzar(): void {
    if (this.loginForm.invalid) {
      this.mostrarError('Debe aceptar los términos y condiciones');
      return;
    }

    // Crear nueva sesión
    const idAcceso = this.sesionService.crearNuevaSesion();
    // Mostrar mensaje con el ID generado
    this.mostrarMensajeExito(`Se ha generado su ID de acceso: ${idAcceso}. Guárdelo para continuar más tarde.`);
    
     // Redirigir al prelogin después de un breve delay
    setTimeout(() => {
      this.router.navigate(['/prelogin']);
    }, 1500);
  }

  /**
   * Acceso con ID existente
   */
  accederConId(): void {
    if (this.accesoForm.invalid) {
      this.mostrarError('Ingrese un ID de acceso válido');
      return;
    }

    this.isLoading = true;
    const idAcceso = this.accesoForm.get('idAcceso')?.value?.toUpperCase() || '';

    // Validar formato básico
    const regex = /^EXM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!regex.test(idAcceso)) {
      this.mostrarError('Formato de ID inválido. Debe ser: EXM-XXXX-XXXX-XXXX');
      this.isLoading = false;
      return;
    }
     // Intentar recuperar sesión
    setTimeout(() => {
      try {
        const sesionRecuperada = this.sesionService.recuperarSesion(idAcceso);
        
        if (sesionRecuperada) {
          this.mostrarMensajeExito('Sesión recuperada exitosamente');
          this.redirigirSegunPaso();
        } else {
          this.mostrarError('ID de acceso inválido o expirado');
        }
      } catch (error) {
        this.mostrarError('Error al verificar el ID de acceso');
        console.error('Error en acceso con ID:', error);
      } finally {
        this.isLoading = false;
      }
    }, 1000);
  }

  /**
   * Redirigir según el paso actual de la sesión
   */
   private redirigirSegunPaso(): void {
    const sesion = this.sesionService.getSesionActualValue();
    
    if (!sesion) {
      this.router.navigate(['/prelogin']);
      return;
    }

    switch (sesion.pasoActual) {
      case 0: // Prelogin
        this.router.navigate(['/prelogin']);
        break;
      case 1: // Empresa verificada
        // Cargar empresa si existe en datos parciales
        if (sesion.datosParciales?.empresa) {
          this.empresaService.guardarEmpresaExamen(sesion.datosParciales.empresa);
        }
        this.router.navigate(['/prelogin']);
        break;
      case 2: // Formulario de examen
        this.router.navigate(['/examen-preocupacional']);
        break;
      default:
        this.router.navigate(['/prelogin']);
    }
  }

  /**
   * Mostrar mensaje de éxito
   */
  private mostrarMensajeExito(mensaje: string): void {
    // En un sistema real, usarías un servicio de notificaciones
    console.log('✅', mensaje);

    alert(mensaje); // Temporal - reemplazar con toast
  }

 /**
   * Cambiar modo de acceso
   */
  cambiarModo(modo: 'nuevo' | 'recuperar'): void {
    this.modo = modo;
    this.mensajeError = '';
    this.accesoForm.reset();
    this.idEjemploGenerado = false;
  }
  /**
   * Mostrar error
   */
  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    
    // Limpiar después de 5 segundos
    setTimeout(() => {
      if (this.mensajeError === mensaje) {
        this.mensajeError = '';
      }
    }, 5000);
  }

  /**
   * Copiar ID al portapapeles
   */
  copiarId(id: string): void {
    navigator.clipboard.writeText(id).then(() => {
      // Mostrar feedback
      console.log('📋 ID copiado al portapapeles');
    });
  }

  /**
   * Generar ejemplo de ID
   */
  generarEjemplo(): void {
    // Generar un ID de ejemplo válido
    const ejemplo = this.generarIdEjemplo();
    
    this.accesoForm.patchValue({ idAcceso: ejemplo });
    this.idEjemploGenerado = true;
    
    // Mostrar mensaje informativo
    console.log('📋 Ejemplo de ID generado:', ejemplo);
    
    // Seleccionar todo el texto para facilitar copiar
    setTimeout(() => {
      const input = document.querySelector('input[formControlName="idAcceso"]') as HTMLInputElement;
      if (input) {
        input.select();
      }
    }, 100);
  }

  /**
   * Generar un ID de ejemplo válido
   */
  private generarIdEjemplo(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    const generarParte = (longitud: number) => {
      let resultado = '';
      for (let i = 0; i < longitud; i++) {
        resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      return resultado;
    };
    
    return `EXM-${generarParte(4)}-${generarParte(4)}-${generarParte(4)}`;
  }

  /**
   * Método para el evento blur (cuando pierde el foco)
   */
  onIdBlur(): void {
    const control = this.accesoForm.get('idAcceso');
    if (!control) return;
    
    let valor = control.value?.trim();
    
    if (valor) {
      // Asegurar formato correcto
      valor = valor.toUpperCase();
      
      // Si no empieza con EXM, agregarlo
      if (!valor.startsWith('EXM')) {
        valor = 'EXM-' + valor.replace(/^EXM-?/i, '');
      }
      
      // Validar formato final
      const regex = /^EXM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      if (!regex.test(valor)) {
        // Intentar corregir formato
        valor = this.corregirFormatoId(valor);
      }
      
      if (valor !== control.value) {
        control.setValue(valor, { emitEvent: true });
      }
      
      // Marcar como tocado para mostrar errores
      control.markAsTouched();
    }
  }

  /**
   * Intentar corregir formato de ID
   */
  private corregirFormatoId(valor: string): string {
    // Remover todos los guiones y espacios
    let limpio = valor.replace(/[^A-Z0-9]/g, '');
    
    // Remover EXM si está al inicio
    if (limpio.startsWith('EXM')) {
      limpio = limpio.substring(3);
    }
    
    // Tomar solo los primeros 12 caracteres (4+4+4)
    limpio = limpio.substring(0, 12);
    
    // Asegurar que tenga 12 caracteres rellenando con ceros
    while (limpio.length < 12) {
      limpio += '0';
    }
    
    // Formatear en grupos de 4
    const parte1 = limpio.substring(0, 4);
    const parte2 = limpio.substring(4, 8);
    const parte3 = limpio.substring(8, 12);
    
    return `EXM-${parte1}-${parte2}-${parte3}`;
  }

  /**
   * Copiar ID al portapapeles
   */
  copiarIdAlPortapapeles(): void {
    const id = this.accesoForm.get('idAcceso')?.value;
    
    if (id) {
      navigator.clipboard.writeText(id).then(() => {
        console.log('📋 ID copiado al portapapeles:', id);
        
        // Mostrar feedback visual
        const original = this.mensajeError;
        this.mensajeError = '✅ ID copiado al portapapeles';
        
        setTimeout(() => {
          if (this.mensajeError === '✅ ID copiado al portapapeles') {
            this.mensajeError = original || '';
          }
        }, 2000);
      }).catch(err => {
        console.error('Error al copiar:', err);
        this.mostrarError('No se pudo copiar el ID');
      });
    }
  }

  /**
   * Ver términos y condiciones
   */
  verTerminos(): void {
    const terminos = `
TÉRMINOS Y CONDICIONES - SISTEMA CNS

1. ACEPTACIÓN
Al utilizar este sistema, usted acepta estos términos y condiciones.

2. ID DE ACCESO ÚNICO
- Se generará un ID único para cada registro
- Es su responsabilidad guardar este ID
- El ID expira después de 7 días
- Un ID solo puede ser usado por una persona

3. USO DEL SISTEMA
- Solo para registro de exámenes preocupacionales
- Información veraz y completa requerida
- Respeto a la confidencialidad de datos

4. PROTECCIÓN DE DATOS
- Sus datos son tratados con confidencialidad
- Cumplimiento con ley de protección de datos
- No compartiremos su información con terceros

5. RESPONSABILIDADES
- Verificar información antes de enviar
- Notificar cualquier error en sus datos
- Mantener su ID de acceso seguro

Para preguntas: contacto@cns.gob.bo
    `;
    
    alert(terminos);
  }
}