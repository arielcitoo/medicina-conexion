import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_CONFIG, ERROR_MESSAGES } from '../shared/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected http = inject(HttpClient);
  protected baseUrl = `${API_CONFIG.baseUrl}/${API_CONFIG.version}`;
  protected token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3Njg1NzA3OTYsImV4cCI6MTc2ODYwNjc5NiwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2ODU3MDc5NiwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IkI4OUIwQjQ3QTNFODczRjRBQzFCMTM3MTkxRDgwREUwIiwiaWF0IjoxNzY4NTcwNzk2LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.Jo0fEztWJfIshNTx25hMcChaCqt8MoN1mkDkJXpQqdTZ_H7ba4TG8FOKOJmigAjrwO1n-nxmk1DQ_CSBZRgvMuQLj4R3gqMmzradESHnCqJ0HD7zhbyXSU3bHE8gt1_Fy2oqlaaMVqThdo9sjctbKaIzK9DUEM4FLv-wGEQbrj9IXBV4NnzZA7k4A8R3X3zuehg-pGy0eJsgZ0IMSM3kB-K_pV3GWYand1cNA8eHdhcknodHu_-0DG6z7WFN0_kvkXYc9_r2KslFZGvKbMvS2tO1CTq1JdJd8mAnzfMZwyB1jaZI6bHzlLuh_Cepjb2ImyQZLrLHUydM2AKAcGhBLQ';

    /**
   * Obtiene el token actual
   */
  getToken(): string {
    return this.token;
  }

  protected getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = ERROR_MESSAGES.serverError;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = ERROR_MESSAGES.connection;
          break;
        case 400:
          errorMessage = 'Solicitud incorrecta. Verifique los datos enviados.';
          break;
        case 401:
          errorMessage = ERROR_MESSAGES.unauthorized;
          break;
        case 403:
          errorMessage = ERROR_MESSAGES.forbidden;
          break;
        case 404:
          errorMessage = ERROR_MESSAGES.notFound;
          break;
        case 500:
          errorMessage = ERROR_MESSAGES.serverError;
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = ERROR_MESSAGES.serviceUnavailable;
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  setToken(newToken: string): void {
    this.token = newToken;
  }

  isTokenValid(): boolean {
    return !!this.token && this.token.length > 100;
  }
}
