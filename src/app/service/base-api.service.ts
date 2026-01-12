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
  protected token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3NjgyNDUwMzEsImV4cCI6MTc2ODI4MTAzMSwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2ODI0NTAzMSwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6Ijc2NkYwM0RDQzQ2QTA2MDEyQjQ4REU1MzI1NDk3QzU5IiwiaWF0IjoxNzY4MjQ1MDMxLCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.nYMBDOU9zoZkUBSHvRyRj6IgrtjHAjrNEXwL8kV6l-ePqhLnE25UtzMVhqcIJllrOvyJppzELCsqCAHZ4tgh-EGin2WRAnVuMqeij0ofiq2E5O1EWV0kx7xNJSOybYcIozudoKc2McWHgf6FuLt6VCSqDCFSciKEEvzqhYgwAuY521VmdsOKgIDnpsyRRIKGF95t1rAW8ZdKivAKFqYKFX8tjBAwGhlsU9Yzcs__Wb8mNIi_Kbr8BmIz1Q6RW_BgbhLBZQXYqOdE1BupBRDMX1eYhstb8XBkYRC-gchgFNGT_BCrnfqhzn6gpziKpRrHoKEbiXD5VvWhgQ7bcC_Tag';

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
