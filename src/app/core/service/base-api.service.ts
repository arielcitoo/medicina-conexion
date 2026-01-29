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
  protected token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3Njk3MDAxMTIsImV4cCI6MTc2OTczNjExMiwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2OTY5OTk4MiwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjZCNTY4NTM2MTUyMTA1MTI4REQ1Q0ZCQzhFRkM1ODI0IiwiaWF0IjoxNzY5NzAwMTEyLCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.TH98dy8q5DgXi2nGe-alA6MFoNGuyK1jnqyK7tEZeT84SjXoiMlqn0ClMe6Kg7p81mbeqt-OrpMqe0jGfAJzI5cENu9nybcTG1k4njDB-KX8pekHrFcNwPH_8xkkH8IniS7vqbZk2bRsExlHpPK29dBTWZEupd4F8HfSx6N5H4p45WcEsVE4HMTKbsJHc4d0sRMPGyAlVNMArY_jlYLOtLjfhgHu2et0cyNcNTQVQzgZvShnkBybrme8RtEIjLXzoa6zpGOVIYo3AH6gOqk8Mjp1i5aStR0CU45YQyFqrLKL_e6QAwiPzCOs_8RyZLrWzC5Q-bhjL_i79YG-fuY6-Q';

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

    // Métodos HTTP helper simplificados
  protected getRequest<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(
      `${this.baseUrl}${endpoint}`,
      { 
        headers: this.getAuthHeaders(),
        params: params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  protected postRequest<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(
      `${this.baseUrl}${endpoint}`,
      body,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  protected putRequest<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(
      `${this.baseUrl}${endpoint}`,
      body,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  protected deleteRequest<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(
      `${this.baseUrl}${endpoint}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
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