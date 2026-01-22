// core/services/base-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export abstract class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected readonly configService = inject(ConfigService);
  
  protected get baseUrl(): string {
    return this.configService.apiConfig.baseUrl;
  }

  protected getAuthHeaders(): HttpHeaders {
    // Mover token a servicio separado (ver siguiente paso)
    const token = 'tu-token-aqui'; // Debería venir de un TokenService
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessages = {
      0: 'Error de conexión. Verifique su internet.',
      400: 'Solicitud incorrecta. Verifique los datos.',
      401: 'No autorizado. Su sesión ha expirado.',
      403: 'Acceso prohibido.',
      404: 'Recurso no encontrado.',
      409: 'Conflicto: El recurso ya existe.',
      500: 'Error interno del servidor.',
      502: 'Servicio temporalmente no disponible.',
      503: 'Servicio no disponible.',
      504: 'Tiempo de espera agotado.'
    };

    const message = errorMessages[error.status] || 
                   error.error?.message || 
                   `Error ${error.status}: ${error.message}`;

    console.error('API Error:', {
      status: error.status,
      message: error.message,
      url: error.url,
      details: error.error
    });

    return throwError(() => new Error(message));
  }
}