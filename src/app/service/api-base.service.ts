import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })


export abstract class ApiBaseService {

  protected readonly http = inject(HttpClient);
  protected readonly apiUrl = environment.apiBaseUrl;
  protected readonly apiVersion = environment.version;

  protected getFullUrl(endpoint: string): string {
    return `${this.apiUrl}/${this.apiVersion}/${endpoint}`;
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
          break;
        case 400:
          errorMessage = 'Solicitud incorrecta. Verifique los datos enviados.';
          break;
        case 401:
          errorMessage = 'No autorizado. Su sesión ha expirado.';
          break;
        case 403:
          errorMessage = 'Acceso prohibido. No tiene permisos para este recurso.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error(`API Error [${error.status}]:`, errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
