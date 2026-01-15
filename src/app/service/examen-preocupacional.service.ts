import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginationDTO } from '../models/PaginationDTO';
import { buildQueryParams } from '../shared/functions/buildQueryParams';

export interface ExamenPreocupacionalCreateDTO {
  numeroPatronal: string;
  razonSocial: string;
  nit: string;
  asegurados: AseguradoCreateDTO[];
  observaciones?: string;
}

export interface AseguradoCreateDTO {
  aseguradoId: number;
  ci: string;
  nombreCompleto: string;
  fechaNacimiento: string; // Formato: YYYY-MM-DD
  genero?: string;
  correoElectronico: string;
  celular: string;
  empresa: string;
  nitEmpresa?: string;
}

export interface ExamenPreocupacionalDTO {
  id: number;
  numeroPatronal: string;
  razonSocial: string;
  nit: string;
  fechaSolicitud: string;
  fechaAprobacion?: string;
  estado: string;
  observaciones?: string;
  asegurados: AseguradoDTO[];
  documentos?: DocumentoExamenDTO[];
}

export interface AseguradoDTO {
  id: number;
  examenId: number;
  aseguradoId: number;
  ci: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  genero?: string;
  correoElectronico: string;
  celular: string;
  empresa: string;
  nitEmpresa?: string;
  estado: string;
  fechaRegistro: string;
}

export interface DocumentoExamenDTO {
  id: number;
  examenId: number;
  nombreArchivo: string;
  rutaArchivo?: string;
  tipoDocumento: string;
  tamanioBytes: number;
  contentType?: string;
  fechaCarga: string;
  observaciones?: string;
}

export interface DocumentoCreateDTO {
  archivo: File;
  tipoDocumento: string;
  observaciones?: string;
}

export interface BuscarExamenesDTO extends PaginationDTO {
  numeroPatronal?: string;
  razonSocial?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}


@Injectable({
  providedIn: 'root'
})
export class ExamenPreocupacionalService {
  private http = inject(HttpClient);
  private urlBase = environment.apiUrl + '/examenes-preocupacionales';
  /**
   * Obtiene la lista paginada de exámenes
   */
  public getPagination(filtros: BuscarExamenesDTO): Observable<HttpResponse<ExamenPreocupacionalDTO[]>> {
    let queryParams = buildQueryParams(filtros);
    return this.http.get<ExamenPreocupacionalDTO[]>(this.urlBase, {
      params: queryParams,
      observe: 'response'
    });
  }

  /**
   * Crea un nuevo examen preocupacional
   */
  public createExamen(examen: ExamenPreocupacionalCreateDTO): Observable<any> {
  // DEBUG: Verificar datos antes de enviar
  console.log('Enviando examen al backend:', examen);
  
  // Formatear fechas de los asegurados
  const examenFormateado = {
    ...examen,
    asegurados: examen.asegurados.map(asegurado => ({
      ...asegurado,
      fechaNacimiento: this.formatFecha(asegurado.fechaNacimiento)
    }))
  };
  
  console.log('Examen formateado:', examenFormateado);
  
  return this.http.post(this.urlBase, examenFormateado).pipe(
    catchError((error) => {
      console.error('Error en servicio createExamen:', error);
      return throwError(() => error);
    })
  );
}

  /**
   * Obtiene un examen por ID
   */
  public getById(id: number): Observable<ExamenPreocupacionalDTO> {
    return this.http.get<ExamenPreocupacionalDTO>(`${this.urlBase}/${id}`);
  }

  /**
   * Actualiza un examen existente
   */
  public updateExamen(id: number, examen: { observaciones?: string; estado?: string }): Observable<any> {
    return this.http.put(`${this.urlBase}/${id}`, examen);
  }

  /**
   * Elimina un examen
   */
  public deleteExamen(id: number): Observable<any> {
    return this.http.delete(`${this.urlBase}/${id}`);
  }

  /**
   * Sube un documento para un examen
   */
  public subirDocumento(examenId: number, documento: DocumentoCreateDTO): Observable<any> {
    const formData = this.createFormDataDocumento(documento);
    const url = `${environment.apiUrl}/examenes/${examenId}/documentos`;
    return this.http.post(url, formData);
  }

  /**
   * Obtiene documentos de un examen
   */
  public getDocumentos(examenId: number): Observable<DocumentoExamenDTO[]> {
    const url = `${environment.apiUrl}/examenes/${examenId}/documentos`;
    return this.http.get<DocumentoExamenDTO[]>(url);
  }

  /**
   * Elimina un documento
   */
  public deleteDocumento(examenId: number, documentoId: number): Observable<any> {
    const url = `${environment.apiUrl}/examenes/${examenId}/documentos/${documentoId}`;
    return this.http.delete(url);
  }

  /**
   * Crea FormData para documentos
   */
  private createFormDataDocumento(documento: DocumentoCreateDTO): FormData {
    const formData = new FormData();
    formData.append('archivo', documento.archivo);
    formData.append('tipoDocumento', documento.tipoDocumento);
    
    if (documento.observaciones) {
      formData.append('observaciones', documento.observaciones);
    }
    
    return formData;
  }

  /**
   * Formatea la fecha al formato YYYY-MM-DD
   */
  private formatFecha(fecha: string | Date): string {
  console.log('Formateando fecha:', fecha);
  
  if (!fecha) {
    console.warn('Fecha vacía recibida');
    return '';
  }
  
  if (typeof fecha === 'string') {
    // Si ya es string, verificar formato
    if (fecha.includes('T')) {
      const result = fecha.split('T')[0];
      console.log('Fecha ya en formato ISO, resultado:', result);
      return result;
    }
     // Verificar si ya está en formato YYYY-MM-DD
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (fechaRegex.test(fecha)) {
      console.log('Fecha ya en formato YYYY-MM-DD:', fecha);
      return fecha;
    }
     // Intentar parsear otros formatos
    console.log('Parseando fecha string:', fecha);
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', fecha);
        return '';
      }
      const result = date.toISOString().split('T')[0];
      console.log('Fecha parseada, resultado:', result);
      return result;
    } catch (e) {
      console.error('Error parseando fecha:', fecha, e);
      return '';
    }
  }

  // Si es Date, convertir a formato YYYY-MM-DD
  if (fecha instanceof Date) {
    const result = fecha.toISOString().split('T')[0];
    console.log('Fecha Date convertida, resultado:', result);
    return result;
  }
  
  console.error('Tipo de fecha no soportado:', typeof fecha, fecha);
  return '';
}

  /**
   * Obtiene todos los exámenes (sin paginación)
   */
  public getAll(): Observable<ExamenPreocupacionalDTO[]> {
    return this.http.get<ExamenPreocupacionalDTO[]>(this.urlBase);
  }
}