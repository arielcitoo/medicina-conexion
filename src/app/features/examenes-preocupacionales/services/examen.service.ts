import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BusquedaAseguradoResponse } from '../../../interface/asegurado.interface';
import { AseguradoExamen } from '../../../interface/examen.interface';
import { AseguradosService } from '../../../core/service/asegurados.service';


@Injectable({
  providedIn: 'root'
})
export class ExamenService {
  
  constructor(private apiAseguradosService: AseguradosService) {}

  /**
   * Buscar asegurado por CI y fecha de nacimiento usando el API service existente
   */
  buscarAsegurado(ci: string, fechaNacimiento: Date): Observable<{success: boolean, data?: AseguradoExamen, mensaje?: string}> {
    // Formatear fecha como YYYY-MM-DD
    const fechaFormateada = this.formatearFecha(fechaNacimiento);
    
    return this.apiAseguradosService.buscarAsegurado(ci, fechaFormateada).pipe(
      map((response: BusquedaAseguradoResponse) => {
        
        // Mapear la respuesta del API a nuestro formato
        return this.mapearRespuestaAsegurado(response, ci, fechaNacimiento);
      }),
      catchError((error) => {
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
  private mapearRespuestaAsegurado(response: BusquedaAseguradoResponse, ci: string, fechaNacimiento: Date): 
    {success: boolean, data?: AseguradoExamen, mensaje?: string} {
    
    // Si la respuesta está vacía o no tiene datos
    if (!response || !response.success || !response.data) {
      return {
        success: false,
        mensaje: response?.message || 'Asegurado no encontrado con los datos proporcionados'
      };
    }

    const datosAsegurado = response.data;
    
    // Crear objeto AseguradoExamen
    const asegurado: AseguradoExamen = {
      aseguradoId: datosAsegurado.aseguradoId || 0,
      ci: datosAsegurado.documentoIdentidad || ci,
      nombreCompleto: datosAsegurado.nombreCompleto || `${datosAsegurado.nombres} ${datosAsegurado.paterno} ${datosAsegurado.materno}`.trim(),
      fechaNacimiento: datosAsegurado.fechaNacimiento || this.formatearFecha(fechaNacimiento),
      correoElectronico: datosAsegurado.correoElectronico || '',
      celular: datosAsegurado.celular || '',
      empresa: datosAsegurado.razonSocial || '',
      nitEmpresa: datosAsegurado.nroPatronal || '',
      genero: datosAsegurado.genero,
      // Campos opcionales
      ...(datosAsegurado.cargo && { cargo: datosAsegurado.cargo }),
      ...(datosAsegurado.area && { area: datosAsegurado.area }),
      ...(datosAsegurado.fechaIngreso && { fechaIngreso: datosAsegurado.fechaIngreso }),
      // Campos de la interfaz AseguradoExamen
      idTemporal: Date.now() // ID temporal para la UI
    };

    return {
      success: true,
      data: asegurado,
      mensaje: response.message || 'Asegurado encontrado exitosamente'
    };
  }

  /**
   * Formatear fecha a YYYY-MM-DD
   */
  private formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    
    let date: Date;
    
    if (typeof fecha === 'string') {
      if (fecha.includes('/')) {
        const [dia, mes, anio] = fecha.split('/').map(Number);
        date = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
      } else {
        date = new Date(fecha);
      }
    } else {
      date = fecha;
    }
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
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
      return new Promise(resolve => {
        setTimeout(() => resolve(response), 1500);
      });
    }));
  }
}