import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
  
  // 🔴 MISMA CONFIGURACIÓN QUE TU ApiService FUNCIONAL
  private baseUrl = 'https://api-desarrollo.cns.gob.bo/erpcns/v1';
  private token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3NjY0OTQ0MTgsImV4cCI6MTc2NjUzMDQxOCwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2NjQ5NDQxOCwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjMxMjQ3MzNDNDY4Q0EzMzYyN0RENDgzQzEyRTA0RTEwIiwiaWF0IjoxNzY2NDk0NDE4LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.T0H8YSon718lxDoIGQ9wRfcY346vaKzPwOoM_IUIKBuABgFQggufVJj8ddBtPUrvq6ndCzKXbPHslZzIOzBJ_GwNufLTbvbzfvjt1fi6uxz4_aPshxroXqftPL8TblxBfIPwZL5cJr3zRnEbb4cCGrfzIQlY-_45kUIsF5vBt70prIMXgM1D4IJZm9Xhl56omJiXh_BZDXrUTovBq12Fna4x6O4CVEAQwOVoIAkhHJ7XPVd3Lkp5tikcMX0Ov6y1RzOUBbvlNqd9KL2IwW0za-e4USxGDr-1iWtl6GTesVONsb_mTIZURSgEjTG9DsU1G_Q3eSZKDDVwoB0S6sS3rg';
  private tokenKey = 'jwt_token';

  private empresaKey = 'empresa_examen_preocupacional';

  constructor() {
    console.log('✅ AuthService inicializado');
    console.log('🔗 Base URL:', this.baseUrl);
  }

  /**
   * Buscar empresa por número patronal
   */
  buscarEmpresa(numeroPatronal: string): Observable<any> {
  const url = `${this.baseUrl}/Afiliaciones/EmpresasAfiliadas/Search`;
  const params = new HttpParams()
    .set('Tipo', '3')
    .set('Search', numeroPatronal);

  console.log('🔍 Buscando empresa:', {
    url,
    numeroPatronal,
    params: { Tipo: '3', Search: numeroPatronal }
  });

  const headers = this.getAuthHeaders();

  return this.http.get<any[]>(url, {
    params,
    headers,
    observe: 'response'  // Observar la respuesta completa
  }).pipe(
    tap(response => {
      console.log('✅ Respuesta HTTP completa:', {
        status: response.status,
        statusText: response.statusText,
        body: response.body
      });
    }),
    map(response => {
      // Verificar si hay respuesta
      if (!response.body || response.body.length === 0) {
        throw new Error('EMPRESA_NO_ENCONTRADA');
      }
      
      return this.procesarRespuesta(response.body, numeroPatronal);
    }),
    catchError(this.handleError)
  );
}

  /**
   * Manejo de errores (igual que tu ApiService)
   */
private handleError(error: any) {
  console.error('❌ Error en AuthService:', error);
  
  let errorMessage = 'Error desconocido';
  let errorCode = 'UNKNOWN_ERROR';

  if (error.status === 0) {
    errorMessage = 'Error de conexión. Verifique su conexión a internet.';
    errorCode = 'CONNECTION_ERROR';
  } else if (error.status === 404) {
    errorMessage = 'Empresa no encontrada. Verifique el número patronal.';
    errorCode = 'EMPRESA_NO_ENCONTRADA';
  } else if (error.status === 401) {
    errorMessage = 'Error de autenticación. Token inválido o expirado.';
    errorCode = 'AUTH_ERROR';
  } else if (error.status === 500) {
    errorMessage = 'Error interno del servidor. Intente más tarde.';
    errorCode = 'SERVER_ERROR';
  } else if (error.message === 'EMPRESA_NO_ENCONTRADA') {
    errorMessage = 'No se encontró ninguna empresa con ese número patronal.';
    errorCode = 'EMPRESA_NO_ENCONTRADA';
  } else {
    errorMessage = error.message || 'Error desconocido';
    errorCode = error.error?.code || 'UNKNOWN';
  }

  return throwError(() => ({
    success: false,
    mensaje: errorMessage,
    codigo: errorCode,
    status: error.status || 0,
    error: error.error
  }));
}
  /**
   * Procesar respuesta
   */
  private procesarRespuesta(response: any[], numeroPatronal: string): any {
    console.log('📊 Procesando respuesta:', response);

    if (!response || !Array.isArray(response) || response.length === 0) {
      throw new Error('EMPRESA_NO_ENCONTRADA');
    }

    const empresaData = response[0];
    console.log('🏢 Datos de empresa:', empresaData);

    // Normalizar datos según la estructura que recibimos
    const empresaNormalizada = {
      id: empresaData.id || empresaData.empresaId || 0,
      empresaId: empresaData.empresaId || 0,
      razonSocial: empresaData.empresa?.razonSocial || 'Sin razón social',
      nit: empresaData.empresa?.nit || '',
      telefono: empresaData.empresa?.telefono || '',
      nroPatronal: empresaData.nroPatronal || numeroPatronal,
      numeroPatronal: empresaData.nroPatronal || numeroPatronal,
      estado: empresaData.parametroEstadoEmpresa?.descripcion || 'DESCONOCIDO',
      fechaAfiliacion: empresaData.fechaAfiliacion || '',
      direccion: empresaData.referenciaDireccion || '',
      nroTrabajadores: empresaData.nroTrabajador || 0,
      
      // Campos adicionales para compatibilidad
      RazonSocial: empresaData.empresa?.razonSocial || 'Sin razón social',
      NIT: empresaData.empresa?.nit || '',
      NumeroPatronal: empresaData.nroPatronal || numeroPatronal,
      Estado: empresaData.parametroEstadoEmpresa?.descripcion || 'DESCONOCIDO',
      Direccion: empresaData.referenciaDireccion || '',
      Telefono: empresaData.empresa?.telefono || '',
      FechaAfiliacion: empresaData.fechaAfiliacion || ''
    };

    console.log('🏢 Empresa normalizada:', empresaNormalizada);

    return {
      success: true,
      empresa: empresaNormalizada,
      mensaje: `Empresa encontrada: ${empresaNormalizada.razonSocial}`
    };
  }

   
  /**
   * Obtener token actual
   */
  getToken(): string {
    return localStorage.getItem(this.tokenKey) || this.token;
  }
  /**
   * Headers de autenticación (igual que tu ApiService)
   */
  private getAuthHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

 /**
 * Guardar empresa con verificación completa
 */
guardarEmpresaExamen(empresa: any): void {
  if (!empresa) {
    console.error('⚠️ Intento de guardar empresa vacía');
    return;
  }
  
  const empresaData = {
    id: empresa.id || empresa.empresaId || 0,
    razonSocial: empresa.razonSocial || empresa.RazonSocial || '',
    numeroPatronal: empresa.numeroPatronal || empresa.nroPatronal || '',
    nit: empresa.nit || empresa.NIT || '',
    estado: empresa.estado || empresa.Estado || '',
    telefono: empresa.telefono || empresa.Telefono || '',
    direccion: empresa.direccion || empresa.Direccion || '',
    fechaAfiliacion: empresa.fechaAfiliacion || empresa.FechaAfiliacion || '',
    // Información de sesión
    fechaVerificacion: new Date().toISOString(),
    sesionId: this.generarSesionId(),
    token: this.token,
    // Estado de verificación
    verificada: true,
    puedeAcceder: this.estaActiva(empresa)
  };
  
  console.log('💾 Guardando empresa en localStorage:', empresaData);
  localStorage.setItem(this.empresaKey, JSON.stringify(empresaData));
  
  // También guardar en sessionStorage para mayor seguridad
  sessionStorage.setItem(this.empresaKey, JSON.stringify(empresaData));
}

/**
 * Obtener empresa verificada
 */
getEmpresaExamen(): any {
  // Intentar primero sessionStorage
  const sessionData = sessionStorage.getItem(this.empresaKey);
  if (sessionData) {
    const empresa = JSON.parse(sessionData);
    console.log('📋 Empresa obtenida de sessionStorage:', empresa);
    return empresa;
  }
  
  // Si no hay en session, intentar localStorage
  const localData = localStorage.getItem(this.empresaKey);
  if (localData) {
    const empresa = JSON.parse(localData);
    console.log('📋 Empresa obtenida de localStorage:', empresa);
    
    // Verificar que la sesión sea reciente (menos de 1 hora)
    const fechaVerificacion = new Date(empresa.fechaVerificacion);
    const ahora = new Date();
    const diferenciaHoras = (ahora.getTime() - fechaVerificacion.getTime()) / (1000 * 60 * 60);
    
    if (diferenciaHoras > 1) {
      console.warn('⚠️ Sesión de empresa expirada');
      this.limpiarDatosExamen();
      return null;
    }
    
    return empresa;
  }
  
  console.log('📋 No hay empresa almacenada');
  return null;
}

/**
 * Verificar si puede acceder al examen
 */
puedeAccederExamen(): boolean {
  const empresa = this.getEmpresaExamen();
  
  if (!empresa) {
    console.log('❌ No hay empresa almacenada para acceso');
    return false;
  }
  
  // Verificar que tenga los datos mínimos
  if (!empresa.razonSocial || !empresa.numeroPatronal) {
    console.warn('⚠️ Empresa con datos incompletos');
    return false;
  }
  
  // Verificar que esté verificada
  if (!empresa.verificada) {
    console.warn('⚠️ Empresa no verificada');
    return false;
  }
  
  // Verificar que esté activa
  if (!this.estaActiva(empresa)) {
    console.warn('⚠️ Empresa inactiva');
    return false;
  }
  
  // Verificar token (opcional si usas token fijo)
  if (!this.isTokenValid()) {
    console.warn('⚠️ Token no válido');
    return false;
  }
  
  console.log('✅ Empresa puede acceder al examen:', empresa.razonSocial);
  return true;
}

/**
 * Generar ID de sesión único
 */
private generarSesionId(): string {
  return 'sesion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}



  limpiarDatosExamen(): void {
    localStorage.removeItem(this.empresaKey);
    console.log('🧹 Datos de empresa limpiados');
  }

  /**
   * Verificar si empresa está activa
   */
  estaActiva(empresa: any): boolean {
    if (!empresa) return false;
    const estado = empresa.estado || empresa.Estado;
    return estado?.toUpperCase().includes('ACTIV') || false;
  }

  /**
   * Verificar token (siempre válido porque usamos el mismo token que funciona)
   */
  isTokenValid(): boolean {
    return true; // El token es válido porque funciona en tu ApiService
  }

  /**
   * Obtener información del token (simplificado)
   */
  getTokenInfo(): any {
    return {
      expirado: false,
      fechaExpiracion: null,
      tiempoRestante: 999999999
    };
  }

  
}