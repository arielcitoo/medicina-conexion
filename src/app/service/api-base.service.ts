// core/services/api-base.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/models';



@Injectable({ providedIn: 'root' })
export abstract class ApiBaseService  {
  protected readonly http = inject(HttpClient);
  protected readonly apiBaseUrl = environment.apiBaseUrl;
  
  // Token fijo de desarrollo
  protected readonly defaultToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3Njc4ODMzNzEsImV4cCI6MTc2NzkxOTM3MSwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2Nzg4MzM3MCwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IkJDQTk2Mzg4QzdEQ0JCMTRGQUFGNjc0NkU0MTc4RTAxIiwiaWF0IjoxNzY3ODgzMzcxLCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.HU_7Gnbk7GjKRCzPWalRANn7PkLx7eeEK-CKfkdoPfQNEo2bSzW9QPOEn0DAlroa76SpLOu6gkPHKTJ5x_gbolVIkJID3Ce0z1f4W_Flge-9h2bbkB_sVIez-DPo3lzHrdbZ87zAUFLIlL3QqRZDWkg11k6xjEIkcg46S09E_zkpx8kYDJjk5s4GGea96rvrwYnXK9w5JnkyigeeKWhAMqqKQ7EEpix8AAoZCsRbkkB8pa2BvErwAAU6omhpCv8M63Zyfwr6VICXhoxR4Y_yQ__Fz5Z13rz5lcGAc_6wjtobKagAF367YnlpObBUefE1EEAzj5M2McZVHOBu5Rxezw';

  /**
   * Headers por defecto
   */
  protected getDefaultHeaders(token?: string): HttpHeaders {
    const authToken = token || this.defaultToken;
    
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    });
  }

  /**
   * Método GET genérico con tipado
   */
  protected get<T>(endpoint: string, params?: HttpParams, token?: string): Observable<T> {
    const url = `${this.apiBaseUrl}/${endpoint}`;
    const headers = this.getDefaultHeaders(token);
    
    console.log(' GET:', { endpoint, params: params?.toString() });
    
    return this.http.get<T>(url, { params, headers })
      .pipe(catchError(this.handleHttpError));
  }

  /**
   * Método GET que retorna ApiResponse<T>
   */
  protected getApiResponse<T>(endpoint: string, params?: HttpParams): Observable<ApiResponse<T>> {
    return this.get<ApiResponse<T>>(endpoint, params);
  }

  /**
   * Manejo centralizado de errores
   */
  protected handleHttpError(error: HttpErrorResponse): Observable<never> {
    console.error(' Error API:', error.status, error.url);
    
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0: errorMessage = 'Sin conexión'; break;
        case 400: errorMessage = 'Solicitud incorrecta'; break;
        case 401: errorMessage = 'No autorizado'; break;
        case 403: errorMessage = 'Acceso prohibido'; break;
        case 404: errorMessage = 'No encontrado'; break;
        case 500: errorMessage = 'Error servidor'; break;
        default: errorMessage = `Error ${error.status}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}