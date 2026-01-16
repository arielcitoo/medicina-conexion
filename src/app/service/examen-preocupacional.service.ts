import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginationDTO } from '../models/PaginationDTO';
import { buildQueryParams } from '../shared/functions/buildQueryParams';

export interface ExamenPreocupacionalResponse {
  id: number;
  numeroPatronal: string;
  razonSocial: string;
  nit: string;
  fechaSolicitud: string;
  estado: string;
  observaciones?: string;
}

export interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: { [key: string]: string[] };
  message?: string;
}

export interface ExamenPreocupacionalCreateDTO {
  numeroPatronal: string;
  razonSocial: string;
  nit: string;
  Asegurados: AseguradoCreateDTO[];
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
  public createExamen(examen: ExamenPreocupacionalCreateDTO): Observable<ExamenPreocupacionalResponse> {
  // DEBUG
  console.log('=== ENVIANDO EXAMEN ===');
  console.log('URL:', this.urlBase);
  console.log('Datos completos:', JSON.stringify(examen, null, 2));
  console.log('Cantidad de asegurados:', examen.Asegurados?.length);
  
  if (examen.Asegurados && examen.Asegurados.length > 0) {
    console.log('Primer asegurado:', examen.Asegurados[0]);
    console.log('Fecha nacimiento del primer asegurado:', examen.Asegurados[0].fechaNacimiento);
  }

  return this.http.post<ExamenPreocupacionalResponse>(this.urlBase, examen).pipe(
    tap((response: ExamenPreocupacionalResponse) => {
      console.log(' Respuesta exitosa del backend:', response);
    }),
    catchError((error: any) => {
      console.error(' Error en createExamen:');
      console.error('Status:', error.status);
      console.error('Status Text:', error.statusText);
      
      if (error.error) {
        console.error('Error body:', error.error);
        
        // Si es error de validación (400)
        if (error.status === 400) {
          const apiError = error.error as ApiErrorResponse;
          
          if (apiError.errors) {
            console.error('Errores de validación:');
            Object.keys(apiError.errors).forEach(key => {
              console.error(`  ${key}:`, apiError.errors![key]);
            });
          } else if (apiError.message) {
            console.error('Mensaje de error:', apiError.message);
          } else if (apiError.detail) {
            console.error('Detalle del error:', apiError.detail);
          }
        }
      }
      
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
   * Obtiene todos los exámenes (sin paginación)
   */
  public getAll(): Observable<ExamenPreocupacionalDTO[]> {
    return this.http.get<ExamenPreocupacionalDTO[]>(this.urlBase);
  }
}