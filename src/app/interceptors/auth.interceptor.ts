import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EmpresaService } from '../service/empresa.service';
import { STORAGE_KEYS } from '../shared/config/api.config';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private empresaService: EmpresaService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener token del servicio
    const token = this.empresaService.getToken();

    // Clonar request y agregar headers de autorización si existe token
    let authReq = req;

    if (token) {
      authReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }

    // Manejar respuesta
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => this.handleHttpError(error))
    );
  }

  /**
   * Maneja errores HTTP de manera centralizada
   */
  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      this.handleUnauthorizedError();
    }

    // Reenviar el error para que lo maneje el componente o servicio
    return throwError(() => error);
  }

  /**
   * Maneja errores de autenticación (401)
   */
  private handleUnauthorizedError(): void {
    // Limpiar datos de sesión
    localStorage.removeItem(STORAGE_KEYS.jwtToken);
    this.empresaService.limpiarDatosExamen();

    // Redirigir a la página de inicio con parámetros de error
    this.router.navigate(['/'], {
      queryParams: {
        sessionExpired: 'true',
        message: 'Su sesión ha expirado. Por favor, verifique nuevamente su empresa.'
      }
    });
  }
}
