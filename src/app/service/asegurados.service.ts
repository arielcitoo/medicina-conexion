import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiBaseService } from './api-base.service';
import { Asegurado, AseguradoApiResponse } from '../shared/models/asegurado.model';
import { Empresa, EmpresaApiResponse } from '../shared/models';



@Injectable({
  providedIn: 'root'
})
export class ApiService extends ApiBaseService {
  private readonly empresaKey = 'empresa_examen_preocupacional';
  
  private empresaSource = new BehaviorSubject<Empresa | null>(null);
  empresaChanged$ = this.empresaSource.asObservable();

  constructor() {
    super();
    this.cargarEmpresaInicial();
  }

  /**
   * Buscar empresa
   */
  buscarEmpresa(numeroPatronal: string): Observable<EmpresaApiResponse> {
    const endpoint = 'Afiliaciones/EmpresasAfiliadas/Search';
    
    const params = new HttpParams()
      .set('Tipo', '3')
      .set('Search', numeroPatronal);

    return this.get<any[]>(endpoint, params).pipe(
      map(response => {
        // Si la respuesta ya tiene estructura ApiResponse
        if (response && typeof response === 'object' && 'success' in response) {
          return response as unknown as EmpresaApiResponse;
        }
        
        // Si no, mapearla
        return this.procesarRespuestaEmpresa(response, numeroPatronal);
      }),
      tap(resultado => {
        if (resultado.success && resultado.data) {
          this.guardarEmpresa(resultado.data);
        }
      })
    );
  }

  /**
   * Procesar respuesta
   */
  private procesarRespuestaEmpresa(response: any[], numeroPatronal: string): EmpresaApiResponse {
    if (!response || !Array.isArray(response) || response.length === 0) {
      return {
        success: false,
        data: null,
        mensaje: 'Empresa no encontrada con ese número patronal'
      };
    }

    const empresaData = response[0];
    
    const empresa: Empresa = {
      id: empresaData.id || empresaData.empresaId || Date.now(),
      empresaId: empresaData.empresaId || 0,
      razonSocial: empresaData.empresa?.razonSocial || 
                   empresaData.razonSocial || 
                   'Sin razón social',
      ruc: empresaData.empresa?.nit || empresaData.nit || '',
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
      email: empresaData.empresa?.email || '',
      tipoEmpresa: empresaData.tipoEmpresa || '',
      
      // Campos para compatibilidad
      RazonSocial: empresaData.empresa?.razonSocial || 'Sin razón social',
      NIT: empresaData.empresa?.nit || '',
      NumeroPatronal: empresaData.nroPatronal || numeroPatronal,
      Estado: empresaData.parametroEstadoEmpresa?.descripcion || 'DESCONOCIDO',
      Direccion: empresaData.referenciaDireccion || '',
      Telefono: empresaData.empresa?.telefono || '',
      FechaAfiliacion: empresaData.fechaAfiliacion || ''
    };

    return {
      success: true,
      data: empresa,
      mensaje: `Empresa encontrada: ${empresa.razonSocial}`
    };
  }

  /**
   * Guardar empresa
   */
  guardarEmpresa(empresa: Empresa): void {
    if (!empresa) return;
    
    const empresaData = {
      ...empresa,
      fechaVerificacion: new Date().toISOString(),
      verificada: true,
      puedeAcceder: this.estaActiva(empresa)
    };
    
    localStorage.setItem(this.empresaKey, JSON.stringify(empresaData));
    this.empresaSource.next(empresaData);
  }

  /**
   * Obtener empresa
   */
  obtenerEmpresa(): Empresa | null {
    try {
      const data = localStorage.getItem(this.empresaKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al obtener empresa:', error);
      return null;
    }
  }

  /**
   * Verificar si empresa está activa
   */
  estaActiva(empresa: Empresa | null): boolean {
    if (!empresa) return false;
    
    const estado = empresa.estado || '';
    const estadoUpper = estado.toUpperCase();
    
    return estadoUpper.includes('ACTIV') || 
           estadoUpper === 'ACTIVO' || 
           estadoUpper === 'ACTIVA' ||
           estadoUpper.includes('VIGENTE');
  }

  /**
   * Verificar acceso
   */
  puedeAccederExamen(): boolean {
    const empresa = this.obtenerEmpresa();
    
    if (!empresa) {
      console.error('No hay empresa almacenada');
      return false;
    }
    
    if (!empresa.verificada) {
      console.warn('Empresa no verificada');
      return false;
    }
    
    if (!this.estaActiva(empresa)) {
      console.warn('Empresa no activa');
      return false;
    }
    
    console.log('Empresa puede acceder al examen');
    return true;
  }

  /**
   * Limpiar empresa
   */
  limpiarEmpresa(): void {
    localStorage.removeItem(this.empresaKey);
    this.empresaSource.next(null);
  }

  private cargarEmpresaInicial(): void {
    const empresa = this.obtenerEmpresa();
    if (empresa) {
      this.empresaSource.next(empresa);
    }
  }
}