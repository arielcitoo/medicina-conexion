import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
    private http = inject(HttpClient);
    
  
  //  MISMA CONFIGURACIÓN QUE TU ApiService FUNCIONAL
  private baseUrl = 'https://api-desarrollo.cns.gob.bo/erpcns/v1';
  private token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3Njc5Nzc4MDUsImV4cCI6MTc2ODAxMzgwNSwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2Nzk3NzgwNSwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjhDNjVCMzNDQzE1MUI0MjUzQzFFNUU1RjgwMjk3Nzg2IiwiaWF0IjoxNzY3OTc3ODA1LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.pVVbZ14LnoTijTaWI_BmDhKmoMe64MoYDbPUfVWccHYGh2eKwQXxZOa1TNL_BPXvZ_WhzsBU0vVrbzZIGY2xOSaxjVoxj-XU1Uk-2F9vlmr5zOTQ131vWvxckexfo1Xzg67C1nJ6pmG89vmCOjCkUaMOnqhT1wrFCTp5IlBG9QhaGyXvAdahLe63lWGnDXdgfpbkaelQC-te0ZMZfnS3DkEMNmJADx-J5SYjx5NTJD55smyUB2EJsEqKHLzfCbRiMdMbhnGXUZTwbliL9lInVm4De_aMm6_IE6pxNvqvIDqsyBvh1zj33PyZWbT1CVfAvMcIsNSAvBBAU7taP7rVsw';
  private tokenKey = 'jwt_token';
  private empresaKey = 'empresa_examen_preocupacional';

    // Subject para cambios en la empresa
  private empresaSource = new BehaviorSubject<any>(null);
  empresaChanged$ = this.empresaSource.asObservable();



  constructor() {
    console.log(' AuthService inicializado');
    //console.log(' Base URL:', this.baseUrl);
  }

 /**
   * Cargar empresa inicial al iniciar
   */
  private cargarEmpresaInicial(): void {
    const empresa = this.getEmpresaExamen();
    if (empresa) {
      console.log(' Empresa cargada al inicio:', empresa.razonSocial);
    }
  }


  /**
   * Buscar empresa por número patronal
   */
  buscarEmpresa(numeroPatronal: string): Observable<any> {
    const url = `${this.baseUrl}/Afiliaciones/EmpresasAfiliadas/Search`;
    const params = new HttpParams()
      .set('Tipo', '3')
      .set('Search', numeroPatronal);

    console.log('🔍 Buscando empresa:', numeroPatronal);

    const headers = this.getAuthHeaders();

    return this.http.get<any[]>(url, {
      params,
      headers
    }).pipe(
      tap(response => {
        console.log(' Respuesta API empresa:', response);
      }),
      map(response => this.procesarRespuestaEmpresa(response, numeroPatronal)),
      tap(resultado => {
        if (resultado.success) {
          // Guardar automáticamente la empresa encontrada
          this.guardarEmpresaExamen(resultado.empresa);
        }
      }),
      catchError(this.handleError)
    );
  }


   /**
   * Procesar respuesta de empresa
   */
  private procesarRespuestaEmpresa(response: any[], numeroPatronal: string): any {
    console.log(' Procesando respuesta empresa:', response);

    if (!response || !Array.isArray(response) || response.length === 0) {
      throw new Error('EMPRESA_NO_ENCONTRADA');
    }

    const empresaData = response[0];
    
    // Normalizar datos
    const empresaNormalizada = {
      id: empresaData.id || empresaData.empresaId || Date.now(),
      empresaId: empresaData.empresaId || 0,
      razonSocial: empresaData.empresa?.razonSocial || 
                   empresaData.razonSocial || 
                   'Sin razón social',
      nit: empresaData.empresa?.nit || empresaData.nit || '',
      telefono: empresaData.empresa?.telefono || empresaData.telefono || '',
      nroPatronal: empresaData.nroPatronal || numeroPatronal,
      numeroPatronal: empresaData.nroPatronal || numeroPatronal,
      estado: empresaData.parametroEstadoEmpresa?.descripcion || 
              empresaData.estado || 
              'DESCONOCIDO',
      fechaAfiliacion: empresaData.fechaAfiliacion || '',
      direccion: empresaData.referenciaDireccion || empresaData.direccion || '',
      nroTrabajadores: empresaData.nroTrabajador || 0,
      
      // Campos compatibilidad
      RazonSocial: empresaData.empresa?.razonSocial || 'Sin razón social',
      NIT: empresaData.empresa?.nit || '',
      NumeroPatronal: empresaData.nroPatronal || numeroPatronal,
      Estado: empresaData.parametroEstadoEmpresa?.descripcion || 'DESCONOCIDO',
      Direccion: empresaData.referenciaDireccion || '',
      Telefono: empresaData.empresa?.telefono || '',
      FechaAfiliacion: empresaData.fechaAfiliacion || ''
    };

    console.log(' Empresa normalizada:', empresaNormalizada);

    return {
      success: true,
      empresa: empresaNormalizada,
      mensaje: `Empresa encontrada: ${empresaNormalizada.razonSocial}`
    };
  }
 
  /**
   * Procesar respuesta
   */
  private procesarRespuesta(response: any[], numeroPatronal: string): any {
    console.log(' Procesando respuesta:', response);

    if (!response || !Array.isArray(response) || response.length === 0) {
      throw new Error('EMPRESA_NO_ENCONTRADA');
    }

    const empresaData = response[0];
    console.log(' Datos de empresa:', empresaData);

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

    console.log(' Empresa normalizada:', empresaNormalizada);

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
   * Guardar empresa en localStorage (MÉTODO MEJORADO)
   */
  guardarEmpresaExamen(empresa: any): void {
    if (!empresa) {
      console.error('⚠️ Intento de guardar empresa vacía');
      return;
    }
    
    const empresaData = {
      ...empresa,
      fechaVerificacion: new Date().toISOString(),
      verificada: true,
      puedeAcceder: this.estaActiva(empresa)
    };
    
    console.log(' Guardando empresa y emitiendo cambio:', empresaData.razonSocial);

    localStorage.setItem(this.empresaKey, JSON.stringify(empresaData));
    
    // Emitir cambio
    this.empresaSource.next(empresaData);
    
    //  EMITIR CAMBIO IMPORTANTE!
  this.empresaSource.next(empresaData);
    // Verificar que se emitió
  console.log(' Cambio emitido:', this.empresaSource.value?.razonSocial);
    // Verificar que se guardó correctamente
    setTimeout(() => {
      const guardada = this.getEmpresaExamen();
      console.log(' Empresa guardada verificación:', guardada ? 'ÉXITO' : 'FALLO');
    }, 100);
  }


  /**
   * Obtener empresa actual
   */
   getEmpresaExamen(): any {
    try {
      const data = localStorage.getItem(this.empresaKey);
      
      if (!data) {
        console.log(' No hay empresa almacenada');
        return null;
      }
      
      const empresa = JSON.parse(data);
      
      // Verificar que la empresa aún sea válida (menos de 1 hora)
      if (empresa.fechaVerificacion) {
        const fechaVerificacion = new Date(empresa.fechaVerificacion);
        const ahora = new Date();
        const diferenciaHoras = (ahora.getTime() - fechaVerificacion.getTime()) / (1000 * 60 * 60);
        
        if (diferenciaHoras > 1) {
          console.warn(' Datos de empresa expirados (más de 1 hora)');
          this.limpiarDatosExamen();
          return null;
        }
      }
      
      console.log(' Empresa obtenida de storage:', empresa.razonSocial);
      
      // Emitir empresa actual
      this.empresaSource.next(empresa);
      
      return empresa;
      
    } catch (error) {
      console.error(' Error al obtener empresa:', error);
      return null;
    }
  }

/**
 * Verificar si puede acceder al examen
 */
puedeAccederExamen(): boolean {
    console.log(' Verificando acceso al examen...');
    
    const empresa = this.getEmpresaExamen();
    
    if (!empresa) {
      console.error(' No hay empresa almacenada');
      return false;
    }
    
    console.log(' Empresa encontrada:', empresa.razonSocial);
    console.log(' Datos empresa:', {
      verificada: empresa.verificada,
      estado: empresa.estado,
      activa: this.estaActiva(empresa)
    });
    
    // Verificar que esté verificada
    if (!empresa.verificada) {
      console.warn(' Empresa no verificada');
      return false;
    }
    
    // Verificar que esté activa
    if (!this.estaActiva(empresa)) {
      console.warn(' Empresa no activa');
      return false;
    }
    
    // Verificar token
    if (!this.isTokenValid()) {
      console.warn(' Token no válido');
      return false;
    }
    
    console.log(' Empresa puede acceder al examen');
    return true;
  }

   /**
   * Redirigir al examen (nuevo método)
   */
  redirigirAExamen(): Promise<boolean> {
    console.log(' Iniciando redirección al examen...');
    
    return new Promise((resolve, reject) => {
      // Verificar acceso
      if (!this.puedeAccederExamen()) {
        const error = 'No tiene permisos para acceder al examen. Verifique que la empresa esté activa.';
        console.error('❌', error);
        reject(error);
        return;
      }
      
      console.log(' Redirección autorizada');
      resolve(true);
    });
  }
/**
 * Generar ID de sesión único
 */
private generarSesionId(): string {
  return 'sesion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}


  /**
   * Limpiar datos
   */
  limpiarDatosExamen(): void {
    localStorage.removeItem(this.empresaKey);
    this.empresaSource.next(null);
    console.log('🧹 Datos de empresa limpiados');
  }

  /**
   * Verificar si empresa está activa
   */
  estaActiva(empresa: any): boolean {
    if (!empresa) return false;
    
    const estado = empresa.estado || empresa.Estado || '';
    const estadoUpper = estado.toUpperCase();
    
    console.log('🔍 Verificando estado empresa:', estadoUpper);
    
    const estaActiva = estadoUpper.includes('ACTIV') || 
                       estadoUpper === 'ACTIVO' || 
                       estadoUpper === 'ACTIVA' ||
                       estadoUpper.includes('VIGENTE');
    
    console.log('📊 Resultado verificación:', estaActiva ? 'ACTIVA' : 'INACTIVA');
    return estaActiva;
  }

    /**
   * Verificar token
   */
  isTokenValid(): boolean {
    // Por ahora, siempre válido porque usamos token fijo
    return !!this.token && this.token.length > 100;
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
   * Obtener información del token (simplificado)
   */
  getTokenInfo(): any {
    return {
      expirado: false,
      fechaExpiracion: null,
      tiempoRestante: 999999999
    };
  }
/**
   * Manejo de errores
   */
  private handleError(error: any) {
    console.error(' Error en AuthService:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet.';
    } else if (error.status === 404) {
      errorMessage = 'Empresa no encontrada. Verifique el número patronal.';
    } else if (error.status === 401) {
      errorMessage = 'Error de autenticación. Token inválido.';
    } else if (error.message === 'EMPRESA_NO_ENCONTRADA') {
      errorMessage = 'No se encontró ninguna empresa con ese número patronal.';
    } else {
      errorMessage = error.message || 'Error desconocido';
    }
    
    return throwError(() => ({
      success: false,
      mensaje: errorMessage,
      status: error.status || 0
    }));
  }
}