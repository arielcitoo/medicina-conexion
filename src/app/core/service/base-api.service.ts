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
  
  // Token debería venir de un servicio de autenticación
  protected token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3Njk2MDQ3MDIsImV4cCI6MTc2OTY0MDcwMiwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2OTYwNDcwMiwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjU0Qjk3MTRBQjM5NTUyODgxNjI4RUMzMTg5N0REM0Q1IiwiaWF0IjoxNzY5NjA0NzAyLCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.Ox12UhmeqYfEOUfw5rXiiP6TaNrBtTRKfhpCUFVX2e1mVy9nk7h_hLmVbuI7Hvt8QfjNQ5L2G3NFdpDSDIAqJxovEDmbv77hsg_aKJ5W8FmpI45cumY7k0SmcXP5kbBGLnc4M7Bd1g6sQP4Sjtu6UyugPthaE_DzVumNnbppOblNR1H7zFgkbq7Dp4agm8TTQAioti7KTfVx4LuYLFKsSJbsq8v4xRtbuEKZ9ZWRhwmMjzW_3eOAox_0vgg74FQSY6jdVIDAtrBbxOFaJI_y82WQtYqxcQlDnLhd0f6jxvTNc9IzI7DAbKyS2Z9XMC3xHF0lkqJoh7ww9WIGioQzfw';

  protected get baseUrl(): string {
    return this.configService.apiConfig.baseUrl;
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string {
    return this.token;
  }

  /**
   * Verifica si el token es válido
   */
  isTokenValid(): boolean {
    return !!this.token && this.token.length > 100; // Validación básica
  }

  /**
   * Establece un nuevo token
   */
  setToken(newToken: string): void {
    this.token = newToken;
  }

  protected getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
  const errorMessages: { [key: number]: string } = {  // <-- Tipo explícito
    0: 'Error de conexión. Verifique su conexión a internet.',
    400: 'Solicitud incorrecta. Verifique los datos enviados.',
    401: 'No autorizado. Su sesión ha expirado.',
    403: 'Acceso prohibido.',
    404: 'Recurso no encontrado.',
    409: 'Conflicto: El recurso ya existe.',
    500: 'Error interno del servidor.',
    502: 'Servicio temporalmente no disponible.',
    503: 'Servicio no disponible.',
    504: 'Tiempo de espera agotado.'
  };

  // Ahora TypeScript sabe que podemos usar números como índices
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