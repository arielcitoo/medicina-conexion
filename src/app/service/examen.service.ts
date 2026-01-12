import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AseguradosService } from './asegurados.service'; // Importar el API service existente
import { Asegurado } from '../shared/models/examen.interface';

@Injectable({
  providedIn: 'root'
})
export class ExamenService {
  
  constructor(private apiAseguradosService: AseguradosService) {}

  /**
   * Buscar asegurado por CI y fecha de nacimiento usando el API service existente
   */
  buscarAsegurado(ci: string, fechaNacimiento: Date): Observable<{success: boolean, data?: Asegurado, mensaje?: string}> {
    // Formatear fecha como YYYY-MM-DD
    const fechaFormateada = this.formatearFecha(fechaNacimiento);
    
    console.log('🔍 Buscando asegurado con:', { ci, fechaFormateada });

    return this.apiAseguradosService.buscarAsegurado(ci, fechaFormateada).pipe(
      map((response: any) => {
        console.log(' Respuesta API asegurado:', response);
        
        // Mapear la respuesta del API a nuestro formato
        return this.mapearRespuestaAsegurado(response, ci, fechaNacimiento);
      }),
      catchError((error) => {
        console.error(' Error al buscar asegurado:', error);
        return of({
          success: false,
          mensaje: this.obtenerMensajeError(error)
        });
      })
    );
  }

  /**
   * Mapear respuesta del API a nuestro formato
   */
  private mapearRespuestaAsegurado(response: any, ci: string, fechaNacimiento: Date): 
    {success: boolean, data?: Asegurado, mensaje?: string} {
    
    // Si la respuesta está vacía o no tiene datos
    if (!response || (Array.isArray(response) && response.length === 0)) {
      return {
        success: false,
        mensaje: 'Asegurado no encontrado con los datos proporcionados'
      };
    }

    // Si es un array, tomar el primer elemento
    const datosAsegurado = Array.isArray(response) ? response[0] : response;
    
    // Validar que tenga datos mínimos
    if (!datosAsegurado || (!datosAsegurado.NombreCompleto && !datosAsegurado.nombreCompleto)) {
      return {
        success: false,
        mensaje: 'Datos del asegurado incompletos'
      };
    }

    // Crear objeto Asegurado
    const asegurado: Asegurado = {
      id: datosAsegurado.Id || datosAsegurado.id || Date.now(),
      ci: ci,
      fechaNacimiento: fechaNacimiento,
      nombreCompleto: datosAsegurado.NombreCompleto || datosAsegurado.nombreCompleto || '',
      documentoIdentidad: datosAsegurado.NumeroDocumentoIdentidad || datosAsegurado.DocumentoIdentidad || ci,
      correoElectronico: datosAsegurado.Email || datosAsegurado.CorreoElectronico || '',
      celular: datosAsegurado.Telefono || datosAsegurado.Celular || '',
      // Campos adicionales que podría traer el API
      ...(datosAsegurado.Genero && { genero: datosAsegurado.Genero }),
      ...(datosAsegurado.EstadoCivil && { estadoCivil: datosAsegurado.EstadoCivil }),
      ...(datosAsegurado.FechaIngreso && { fechaIngreso: new Date(datosAsegurado.FechaIngreso) })
    };

    return {
      success: true,
      data: asegurado,
      mensaje: 'Asegurado encontrado exitosamente'
    };
  }

  /**
   * Formatear fecha a YYYY-MM-DD
   */
  private formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  /**
   * Obtener mensaje de error amigable
   */
  private obtenerMensajeError(error: any): string {
    if (error.status === 404) {
      return 'Asegurado no encontrado en el sistema';
    } else if (error.status === 401 || error.status === 403) {
      return 'Error de autenticación. Token inválido o expirado.';
    } else if (error.status === 0) {
      return 'Error de conexión con el servidor';
    } else if (error.error?.message) {
      return error.error.message;
    }
    return 'Error al buscar el asegurado';
  }

  

  /**
   * Guardar examen preocupacional
   */
  guardarExamen(data: any): Observable<any> {
    // Simulación de guardado
    return of({
      success: true,
      mensaje: 'Examen preocupacional registrado exitosamente',
      id: Math.floor(Math.random() * 1000)
    }).pipe(map(response => {
      // Simular delay
      return new Promise(resolve => {
        setTimeout(() => resolve(response), 1500);
      });
    }));
  }


  
}