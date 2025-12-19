import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interface para la respuesta del asegurado
export interface AseguradoApiResponse {
  aseguradoId: number;
  documentoIdentidad: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  genero: string;
  estado: string;
  codigoAsegurado: string;
  edad: number;
  email?: string;
  celular?: string;
  telefono?: string;
  movil?: string;
  fechaAfiliacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'https://api-desarrollo.cns.gob.bo/erpcns/v1';

  // Token JWT (considera usar un servicio de autenticación)
  private token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3NjYxMDE0MjgsImV4cCI6MTc2NjEzNzQyOCwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2NjEwMTQyOCwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjM3OTU1QTQyOEUwQUFGQ0VBQjZDRDAyNzlDMEJGNjVCIiwiaWF0IjoxNzY2MTAxNDI4LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.VETEl5ulfEAu_IJMtTybKkTqvqUBNsv-kPU8xgyMWflLdtBI0vyJFaZ6WWem8gG1FRypcXNL5aS8rx9S9WihUcOrN0Ea6aUmR4241gkTQBW2QjhZPMhX3MFD7hURmA1hR2jmgyxUNLd5ZZ80QQJMeys2aekwjf3E9rk33QAVWN7QrnaSuSYm7B9h1emNYrwCLLCSMUOcz7yEld50Yd4g8aYFIGpX54NxO53tcjUsENa3p0C0xhJpcVWdbJicfxQllYYhGoDL39rcIkxRdIHDtKvrTDp9hsOZ3n9BbQDIxCxE4m-a11BSHgEiZTm0T3VrX6D5XO-Q5grG8BpIJJ0Rzw';

  constructor() {
    console.log('API Service inicializado');
  }

  /**
   * Buscar asegurado titular con manejo de errores mejorado
   */
  buscarAsegurado(documento: string, fechaNacimiento: string): Observable<AseguradoApiResponse[]> {
    const url = `${this.baseUrl}/Afiliaciones/Asegurados/AseguradoTitular`;

    const params = new HttpParams()
      .set('DocumentoIdentidad', documento)
      .set('FechaNacimiento', fechaNacimiento);

    console.log('Buscando asegurado:', { documento, fechaNacimiento, url });

    return this.http.get<AseguradoApiResponse[]>(url, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Headers de autenticación
   */
  private getAuthHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Manejo de errores centralizado
   */
  private handleError(error: HttpErrorResponse) {
    console.error('Error en API Service:', error);

    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      switch (error.status) {
        case 0:
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
          break;
        case 401:
          errorMessage = 'No autorizado. Token inválido o expirado.';
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

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Actualizar token
   */
  setToken(newToken: string): void {
    this.token = newToken;
    console.log('Token actualizado');
  }

  /**
   * Obtener token actual
   */
  getToken(): string {
    return this.token;
  }
}
