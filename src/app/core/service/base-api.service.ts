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
  protected token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3Njk1MTkzNTksImV4cCI6MTc2OTU1NTM1OSwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2OTUxOTM1OSwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IkQ5RDRFMjAwREUyREQwMDI5QjNGOTMwNEY2RkQyN0VEIiwiaWF0IjoxNzY5NTE5MzU5LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.Xv8by7oGsEawGZeWra0yzGG7ctjmaL2k9-6ip0N103repuCQ9tm_Jg3NVmJvVN7ULoatXMh3urH9mSJ8UM99cqKf2iQ-E00iw3hKrJghC008QL5PY-S93PYUeQacMHOcR10XGuJmOPZXxIqbbOkCebJMTVLb5tmGLqkZ-njtHHRI0B1k_ubeeGTfLt0BhmFgDtRkBmgboM-dfSggcpPvYTdDhuj5yUSG6gBY6EmOlxAhZHOGDfdIknWA20BnLjnyZMxF8NvbTlWAqlPTTI4TGmzOdsUpC4zkRIl4XH19BaKZ9bdEyFHKaJI3Il5nmww-EFadR6NyhJ9_jNs_d2fOBQ';

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