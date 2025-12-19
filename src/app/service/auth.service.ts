import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://api-desarrollo.cns.gob.bo/erpcns/v1';
  private tokenKey = 'jwt_token';
  private empresaKey = 'empresa_data';

  // Token JWT
  private jwtToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3NjYxNDgzODIsImV4cCI6MTc2NjE4NDM4MiwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2NjE0ODM4MiwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjcxNTcxQzgxN0ZCODFDMjhCNjYzODNDNkMzRTY2N0Y4IiwiaWF0IjoxNzY2MTQ4MzgyLCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.ZvJibih7O4dPJ92IWBQPtOP0haJHTC228MEJMoGFTllZT_sHoqR6Qh5LkX4ob0gyksVCLKX-2M-oSoSuXGTCGyPs7kT6DReHisavvuGH7toTEeFx3uxUnzm5_dZPFSxnr51ooFAw1l86iIvDfUbiTQjKclHY2HF1prVOnd4_fA12oO_nNf7OxVtiGFoVTQmYjN6GRCUnznpZSaqJc3KE7ZEsj9UczCbED2-g318bTHOH6Bnx3P4zp_bZn8y87cmfST4cpbXu1yaBnHxKIHOg5Rft3HnwH3y1nyY58umPpXk_X8xFPhSM9YVpzX1Bjq_8RnQMoPC5TBXLYALf7vJPRA';

  constructor(private http: HttpClient) {
    this.loadToken();
  }

  private loadToken(): void {
    if (!localStorage.getItem(this.tokenKey)) {
      localStorage.setItem(this.tokenKey, this.jwtToken);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.tokenKey) || this.jwtToken;
    return new HttpHeaders({
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Buscar empresa por número patronal
   */
  buscarEmpresa(numeroPatronal: string): Observable<any> {
    // Mantener con guiones (según tu curl)
    const params = new HttpParams()
      .set('Tipo', '3')
      .set('Search', numeroPatronal);

    console.log('🔍 Buscando empresa:', {
      url: `${this.apiUrl}/Afiliaciones/EmpresasAfiliadas/Search`,
      params: params.toString(),
      numeroPatronal: numeroPatronal
    });

    return this.http.get<any>(
      `${this.apiUrl}/Afiliaciones/EmpresasAfiliadas/Search`,
      {
        headers: this.getHeaders(),
        params,
        observe: 'response'
      }
    ).pipe(
      map(response => {
        console.log('✅ Respuesta completa del servidor:', response);

        const body = response.body;

        // CASO 1: Si el body es un array directamente
        if (Array.isArray(body)) {
          console.log('📦 Body es un array:', body);

          if (body.length === 0) {
            throw new Error('EMPRESA_NO_ENCONTRADA');
          }

          const empresa = body[0];
          return this.procesarEmpresa(empresa, numeroPatronal);
        }

        // CASO 2: Si el body tiene propiedad 'data' (array)
        else if (body && body.data && Array.isArray(body.data)) {
          console.log('📦 Body tiene propiedad data:', body.data);

          if (body.data.length === 0) {
            throw new Error('EMPRESA_NO_ENCONTRADA');
          }

          const empresa = body.data[0];
          return this.procesarEmpresa(empresa, numeroPatronal);
        }

        // CASO 3: Si el body es un objeto con la empresa directamente
        else if (body && typeof body === 'object') {
          console.log('📦 Body es un objeto:', body);

          // Verificar si el objeto tiene propiedades de empresa
          if (body.NumeroPatronal || body.RazonSocial) {
            return this.procesarEmpresa(body, numeroPatronal);
          }

          // Si tiene propiedad success pero es false
          if (body.success === false) {
            throw new Error('EMPRESA_NO_ENCONTRADA');
          }
        }

        // CASO 4: Cualquier otra estructura
        console.warn('⚠️ Estructura de respuesta no reconocida:', body);
        throw new Error('EMPRESA_NO_ENCONTRADA');
      }),
      catchError(error => this.manejarError(error, numeroPatronal))
    );
  }

  /**
   * Procesar empresa encontrada
   */
  private procesarEmpresa(empresa: any, numeroPatronal: string): any {
    console.log('🏢 Procesando empresa:', empresa);

    // Normalizar datos
    const empresaNormalizada = {
      ID: empresa.ID || empresa.id || 0,
      NIT: empresa.NIT || empresa.nit || empresa.RUC || '',
      NumeroPatronal: empresa.NumeroPatronal || empresa.numeroPatronal || numeroPatronal,
      RazonSocial: empresa.RazonSocial || empresa.razonSocial || empresa.Nombre || 'Sin nombre',
      Estado: empresa.Estado || empresa.estado || empresa.Status || '',
      Direccion: empresa.Direccion || empresa.direccion || '',
      Telefono: empresa.Telefono || empresa.telefono || '',
      Email: empresa.Email || empresa.email || '',
      FechaAfiliacion: empresa.FechaAfiliacion || empresa.fechaAfiliacion || '',
      TipoEmpresa: empresa.TipoEmpresa || empresa.tipoEmpresa || ''
    };

    // Verificar estado
    if (!this.estaActiva(empresaNormalizada.Estado)) {
      console.warn('⚠️ Empresa inactiva:', empresaNormalizada.Estado);
      throw new Error('EMPRESA_INACTIVA');
    }

    // Guardar empresa
    this.guardarEmpresa(empresaNormalizada);

    return {
      success: true,
      empresa: empresaNormalizada,
      mensaje: `Empresa verificada: ${empresaNormalizada.RazonSocial}`
    };
  }

  /**
   * Verificar si empresa está activa
   */
  private estaActiva(estado: string): boolean {
    if (!estado) {
      console.warn('⚠️ Estado vacío');
      return false;
    }

    const estadoUpper = estado.toUpperCase();

    // Posibles valores de estado activo
    const estadosActivos = [
      'ACTIVO', 'ACTIVA', 'A', '1', 'HABILITADO',
      'HABILITADA', 'VIGENTE', 'VIGENTE'
    ];

    const activa = estadosActivos.some(estadoActivo =>
      estadoUpper.includes(estadoActivo)
    );

    console.log(`🔍 Estado: "${estado}" → Activa: ${activa}`);
    return activa;
  }

  /**
   * Guardar empresa
   */
  private guardarEmpresa(empresa: any): void {
    sessionStorage.setItem(this.empresaKey, JSON.stringify(empresa));
    console.log('💾 Empresa guardada:', empresa.RazonSocial);
  }

  /**
   * Manejar errores
   */
  private manejarError(error: any, numeroPatronal: string): Observable<never> {
    console.error('❌ Error en búsqueda:', error);

    // Si el error viene con información de empresa no encontrada
    if (error.error && error.error.message && error.error.message.includes('no encontrada')) {
      return throwError(() => ({
        success: false,
        mensaje: `Empresa ${numeroPatronal} no encontrada`,
        error: error.error
      }));
    }

    // Si es nuestro error personalizado
    if (error.message === 'EMPRESA_NO_ENCONTRADA') {
      return throwError(() => ({
        success: false,
        mensaje: `Empresa ${numeroPatronal} no encontrada en el sistema`
      }));
    }

    if (error.message === 'EMPRESA_INACTIVA') {
      return throwError(() => ({
        success: false,
        mensaje: 'Inactivo, acérquese a afiliaciones para regularizar'
      }));
    }

    // Si es error HTTP
    if (error instanceof HttpErrorResponse) {
      console.error('📊 Error HTTP:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error
      });

      // Si el error tiene información en el body
      if (error.error) {
        return throwError(() => ({
          success: false,
          mensaje: error.error.message || `Error ${error.status}: ${error.statusText}`,
          error: error.error
        }));
      }

      return throwError(() => ({
        success: false,
        mensaje: `Error del servidor (${error.status})`
      }));
    }

    return throwError(() => ({
      success: false,
      mensaje: 'Error en la verificación de empresa'
    }));
  }

  // Resto de métodos...
  getEmpresaActual(): any {
    const empresaData = sessionStorage.getItem(this.empresaKey);
    return empresaData ? JSON.parse(empresaData) : null;
  }

  getToken(): string {
    return localStorage.getItem(this.tokenKey) || this.jwtToken;
  }

  isLoggedIn(): boolean {
    return !!this.getEmpresaActual();
  }

  logout(): void {
    sessionStorage.removeItem(this.empresaKey);
  }
}
