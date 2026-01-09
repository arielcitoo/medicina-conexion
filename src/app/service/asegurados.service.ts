import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

const API_CONFIG = {
  baseUrl: 'https://api-desarrollo.cns.gob.bo/erpcns',
  version: 'v1',
  defaultToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3Njc3MDM0MDcsImV4cCI6MTc2NzczOTQwNywiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2NzcwMzQwNywiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IkJCNjk1Q0QyMDlCN0U4NkE0M0JCNkZGQkZGRDZCODU4IiwiaWF0IjoxNzY3NzAzNDA3LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.uPD9P47YUD72u5lmvpQWrFfy3vKG1JpeS0k0Lf3WQZTo5ywPnf_FHQAnw3gOwSLKuB4ixyR3EfjG2bHI-8fdSEJc0OH9oNKFAD_ezKOkQ6dBHKjp28thruiYYgfOJJVWELT805POu0cJRaCfGxx3Kip7gV-BFaxpxLzkfr0HLxI682NCZRb8k3unrTxrUfuFJGSP6l-prdZxtdGyTQ9jsIwjwnwVX9V7u0pIsa06eI6uvLubgUMo9MvIaTu2yKpUqKMHA5MV-GLQr3n_LX3t4VxLzvoZfD_hkiR-SBDZ704W3kU7seRHGVcgtLs0tWD1VqNtZaArTiX0clynddKH1Q'
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = `${API_CONFIG.baseUrl}/${API_CONFIG.version}`;
  private token = API_CONFIG.defaultToken;

  constructor() {
    console.log(' API Service inicializado');
    console.log(' Base URL:', this.baseUrl);
    console.log(' Token (primeros 50 chars):', this.token.substring(0, 50) + '...');
  }

  /**
   * CONSULTA PRINCIPAL: Buscar asegurado titular
   */
  buscarAsegurado(documento: string, fechaNacimiento: string): Observable<any> {
    const url = `${this.baseUrl}/Afiliaciones/Asegurados/AseguradoTitular`;
    const params = new HttpParams()
      .set('DocumentoIdentidad', documento)
      .set('FechaNacimiento', fechaNacimiento);

    console.log(' Buscando asegurado:');
    console.log('   URL:', url);
    console.log('   Documento:', documento);
    console.log('   Fecha Nacimiento:', fechaNacimiento);
    console.log('   Token (primeros 30):', this.token.substring(0, 30) + '...');

    const headers = this.getAuthHeaders();
    console.log('   Headers:', headers);

    return this.http.get(url, {
      params,
      headers
    }).pipe(
      tap(response => {
        console.log(' Respuesta exitosa de la API:', response);
      }),
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
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse) {
    console.error(' Error en API Service:');
    console.error('   Status:', error.status);
    console.error('   Status Text:', error.statusText);
    console.error('   URL:', error.url);
    console.error('   Headers:', error.headers);
    console.error('   Error:', error.error);

    let errorMessage = 'Error desconocido';

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
          errorMessage = 'No autorizado. Token JWT inválido o expirado.';
          break;
        case 403:
          errorMessage = 'Acceso prohibido. No tiene permisos para acceder a este recurso.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Servicio temporalmente no disponible. Intente más tarde.';
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
    console.log(' Token actualizado');
  }

  /**
   * Verificar token
   */
  checkToken(): boolean {
    return !!this.token && this.token.length > 100;
  }
}
