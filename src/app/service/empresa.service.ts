import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseApiService } from '../service/base-api.service';
import { Empresa, VerificacionEmpresaResponse } from '../interface/empresa.interface';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../shared/config/api.config';

@Injectable({
  providedIn: 'root'
})

export class EmpresaService extends BaseApiService {
  private empresaSource = new BehaviorSubject<Empresa | null>(null);
  empresaChanged$ = this.empresaSource.asObservable();

  constructor() {
    super();
    this.cargarEmpresaInicial();
  }

  /**
   * Cargar empresa desde localStorage al iniciar
   */
  private cargarEmpresaInicial(): void {
    const empresa = this.getEmpresaExamen();
    if (empresa) {
      this.empresaSource.next(empresa);
    }
  }

  /**
   * Buscar empresa por número patronal
   */
  buscarEmpresa(numeroPatronal: string): Observable<VerificacionEmpresaResponse> {
    const url = `${this.baseUrl}${API_CONFIG.endpoints.empresasAfiliadas}`;
    const params = new HttpParams()
      .set('Tipo', '3')
      .set('Search', numeroPatronal);

    return this.http.get<any[]>(url, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.procesarRespuestaEmpresa(response, numeroPatronal)),
      tap(resultado => {
        if (resultado.success) {
          this.guardarEmpresaExamen(resultado.empresa);
        }
      })
    );
  }

  /**
   * Procesa la respuesta de la API y la normaliza
   * Garantiza que siempre retorne una Empresa válida cuando success = true
   */
  private procesarRespuestaEmpresa(response: any[], numeroPatronal: string): VerificacionEmpresaResponse {
    if (!response || !Array.isArray(response) || response.length === 0) {
      return {
        success: false,
        mensaje: ERROR_MESSAGES.empresaNotFound,
        codigo: 'EMPRESA_NO_ENCONTRADA',
        empresa: this.crearEmpresaVacia() // Empresa vacía pero válida
      };
    }

    const empresaData = response[0];
    const empresaNormalizada = this.normalizarEmpresa(empresaData, numeroPatronal);

    return {
      success: true,
      mensaje: `Empresa encontrada: ${empresaNormalizada.razonSocial}`,
      codigo: 'EMPRESA_ENCONTRADA',
      empresa: empresaNormalizada
    };
  }

  /**
   * Normaliza los datos de la empresa a un formato consistente
   */
  private normalizarEmpresa(empresaData: any, numeroPatronal: string): Empresa {
  const estado = empresaData.parametroEstadoEmpresa?.descripcion || empresaData.estado || 'DESCONOCIDO';
  const razonSocial = empresaData.empresa?.razonSocial || empresaData.razonSocial || 'Sin razón social';
  const nit = empresaData.empresa?.nit || empresaData.nit || '';

  return {
    id: empresaData.id || empresaData.empresaId || Date.now(),
    numeroPatronal: empresaData.nroPatronal || numeroPatronal,
    razonSocial: razonSocial,
    ruc: nit, // ¡Aquí se guarda como 'ruc' pero es el NIT!
    direccion: empresaData.referenciaDireccion || empresaData.direccion || '',
    telefono: empresaData.empresa?.telefono || empresaData.telefono || '',
    estado: estado,
    email: empresaData.email || '',
    fechaAfiliacion: new Date(empresaData.fechaAfiliacion || Date.now()),
    tipoEmpresa: empresaData.tipoEmpresa || ''
  };
}
/**
   * Crea una empresa vacía pero válida para mantener consistencia de tipos
   */
  private crearEmpresaVacia(): Empresa {
    return {
      id: 0,
      numeroPatronal: '',
      razonSocial: '',
      ruc: '',
      direccion: '',
      telefono: '',
      estado: '',
      email: '',
      fechaAfiliacion: new Date(),
      tipoEmpresa: ''
    };
  }

  /**
   * Guardar empresa en localStorage y emitir cambio
   */
  guardarEmpresaExamen(empresa: Empresa): void {
    if (!empresa) return;

    const empresaData = {
      ...empresa,
      fechaVerificacion: new Date().toISOString(),
      verificada: true,
      puedeAcceder: this.estaActiva(empresa)
    };

    localStorage.setItem(STORAGE_KEYS.empresaExamen, JSON.stringify(empresaData));
    this.empresaSource.next(empresaData);
  }

   /**
   * Obtener empresa desde localStorage
   */
  getEmpresaExamen(): Empresa | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.empresaExamen);
      if (!data) return null;

      const empresa = JSON.parse(data) as Empresa & { fechaVerificacion: string };

      // Verificar que la empresa aún sea válida (menos de 1 hora)
      const fechaVerificacion = new Date(empresa.fechaVerificacion);
      const ahora = new Date();
      const diferenciaHoras = (ahora.getTime() - fechaVerificacion.getTime()) / (1000 * 60 * 60);

      if (diferenciaHoras > 1) {
        this.limpiarDatosExamen();
        return null;
      }

      this.empresaSource.next(empresa);
      return empresa;
    } catch {
      return null;
    }
  }

  /**
   * Verificar si puede acceder al examen
   */
  puedeAccederExamen(): boolean {
    const empresa = this.getEmpresaExamen();

    if (!empresa) return false;
    if (!this.estaActiva(empresa)) return false;
    if (!this.isTokenValid()) return false;

    return true;
  }

  /**
   * Redirigir al examen (método asíncrono)
   */
  async redirigirAExamen(): Promise<boolean> {
    if (!this.puedeAccederExamen()) {
      throw new Error('No tiene permisos para acceder al examen. Verifique que la empresa esté activa.');
    }
    return true;
  }

  /**
   * Verificar si empresa está activa
   */
  estaActiva(empresa: Empresa): boolean {
    if (!empresa) return false;

    const estado = empresa.estado.toUpperCase();
    return estado.includes('ACTIV') || estado === 'ACTIVO' || estado === 'ACTIVA' || estado.includes('VIGENTE');
  }

  /**
   * Limpiar datos de empresa
   */
  limpiarDatosExamen(): void {
    localStorage.removeItem(STORAGE_KEYS.empresaExamen);
    this.empresaSource.next(null);
  }
}
