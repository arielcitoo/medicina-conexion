import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener token
    const token = this.authService.getToken();
    
    // Clonar request y agregar headers
    let authReq = req;
    
    if (token) {
      authReq = req.clone({
        setHeaders: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }

    // Manejar respuesta
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en interceptor:', error);
        
        if (error.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem('jwt_token');
          this.router.navigate(['/'], {
            queryParams: { 
              sessionExpired: 'true',
              message: 'Su sesión ha expirado. Por favor, verifique nuevamente su empresa.'
            }
          });
        }

        return throwError(() => error);
      })
    );
  }
}