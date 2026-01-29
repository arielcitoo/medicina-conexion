// core/service/auth-cns.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';

export interface UserInfo {
    id: string;
    username: string;
    nombreCompleto: string;
    email: string;
    roles: string[];
    permisos: string[];
    area: string;
    cargo: string;
    unidad: string;
}

@Injectable({ providedIn: 'root' })
export class AuthCnsService {
    private readonly AUTH_URL = 'https://auth-desarrollo.cns.gob.bo';
    private readonly API_URL = 'https://api-desarrollo.cns.gob.bo';
    private readonly STORAGE_KEY = 'cns_auth_data';

    private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        this.loadStoredUser();
    }

    /**
     * Iniciar sesión con el SSO del CNS
     */
    // login(username: string, password: string): Observable<any> {
    //     return this.http.post(`${this.AUTH_URL}/connect/token`, {
    //         grant_type: 'password',
    //         username: username,
    //         password: password,
    //         client_id: 'erp_web_client',
    //         client_secret: 'your_client_secret_here', // Esto debe venir de configuración
    //         scope: 'openid profile email roles offline_access erp_api'
    //     }, {
    //         headers: {
    //             'Content-Type': 'application/x-www-form-urlencoded'
    //         }
    //     }).pipe(
    //         tap((response: any) => {
    //             // Guardar tokens
    //             this.storeTokens(response);
    //             // Obtener información del usuario
    //             return this.getUserInfo();
    //         }),
    //         catchError(error => {
    //             console.error('Error en login:', error);
    //             throw error;
    //         })
    //     );
    // }

    /**
     * Obtener información del usuario autenticado
     */
    getUserInfo(): Observable<UserInfo> {
        return this.http.get<UserInfo>(`${this.API_URL}/api/usuario/info`).pipe(
            tap(user => {
                this.storeUser(user);
                this.currentUserSubject.next(user);
            }),
            catchError(error => {
                console.error('Error obteniendo info usuario:', error);
                throw error;
            })
        );
    }

    /**
     * Cerrar sesión
     */
    logout(): void {
        // Limpiar datos locales
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('cns_access_token');
        localStorage.removeItem('cns_refresh_token');
        sessionStorage.clear();

        // Redirigir al logout del SSO
        window.location.href = `${this.AUTH_URL}/connect/endsession`;
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        if (!token) return false;

        // Verificar expiración del token
        const payload = this.decodeToken(token);
        if (!payload || !payload.exp) return false;

        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
    }

    /**
     * Verificar si tiene rol de administrador
     */
    isAdmin(): boolean {
        const user = this.currentUserSubject.value;
        return user?.roles?.includes('admin') ||
            user?.roles?.includes('administrador') ||
            user?.roles?.includes('administrador_citas') || false;
    }

    /**
     * Verificar permisos específicos
     */
    hasPermission(permission: string): boolean {
        const user = this.currentUserSubject.value;
        return user?.permisos?.includes(permission) || false;
    }

    /**
     * Obtener token de acceso
     */
    getAccessToken(): string | null {
        return localStorage.getItem('cns_access_token');
    }

    /**
     * Decodificar token JWT
     */
    private decodeToken(token: string): any {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    }

    /**
     * Guardar tokens en localStorage
     */
    private storeTokens(authResponse: any): void {
        if (authResponse.access_token) {
            localStorage.setItem('cns_access_token', authResponse.access_token);
        }
        if (authResponse.refresh_token) {
            localStorage.setItem('cns_refresh_token', authResponse.refresh_token);
        }
    }

    /**
     * Guardar información del usuario
     */
    private storeUser(user: UserInfo): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }

    /**
     * Cargar usuario almacenado
     */
    private loadStoredUser(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const user = JSON.parse(stored);
                this.currentUserSubject.next(user);
            }
        } catch (error) {
            console.error('Error cargando usuario almacenado:', error);
        }
    }

    /**
     * Refrescar token (para implementar si es necesario)
     */
    refreshToken(): Observable<any> {
        const refreshToken = localStorage.getItem('cns_refresh_token');
        if (!refreshToken) {
            this.router.navigate(['/login']);
            return of(null);
        }

        return this.http.post(`${this.AUTH_URL}/connect/token`, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: 'erp_web_client',
            client_secret: 'your_client_secret_here'
        }).pipe(
            tap((response: any) => {
                this.storeTokens(response);
            }),
            catchError(error => {
                console.error('Error refrescando token:', error);
                this.logout();
                return of(null);
            })
        );
    }

    // En auth-cns.service.ts - método login
    login(username: string, password: string): Observable<any> {
        // Modo demo para desarrollo
        if (!environment.production && username === 'admin' && password === 'admin') {
            const demoUser: UserInfo = {
                id: 'demo-1',
                username: 'admin',
                nombreCompleto: 'Administrador Demo',
                email: 'admin@cns.gob.bo',
                roles: ['admin', 'administrador_citas'],
                permisos: ['ver_citas', 'aprobar_citas', 'programar_citas'],
                area: 'Medicina del Trabajo',
                cargo: 'Administrador',
                unidad: 'Sistemas'
            };

            localStorage.setItem('cns_access_token', 'demo-token-' + Date.now());
            this.storeUser(demoUser);
            this.currentUserSubject.next(demoUser);

            return of(demoUser);
        }

        // Autenticación real
        return this.http.post(`${this.AUTH_URL}/connect/token`, {
            // ... parámetros reales
        });
    }
}