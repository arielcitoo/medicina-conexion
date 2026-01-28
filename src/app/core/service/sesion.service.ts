import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SesionAcceso } from '../../interface/sesion-acceso.interface';

@Injectable({
  providedIn: 'root',
})
export class SesionService {
private readonly SESSION_KEY = 'examen_sesion_acceso';
  private readonly ID_KEY = 'examen_id_acceso';
  
  private sesionActual = new BehaviorSubject<any>(null);
  
  constructor() {
    // Cargar sesión al iniciar
    this.cargarSesionDesdeStorage();
  }



  
  /**
   * Crear nueva sesión de acceso
   */
  crearNuevaSesion(empresa?: any): string {
    const idAcceso = this.generarIdUnico();
    
    const sesion: SesionAcceso = {
      id: idAcceso,
      empresaId: empresa?.id || '',
      razonSocial: empresa?.razonSocial || '',
      estado: 'ACTIVO',
      fechaCreacion: new Date(),
      fechaExpiracion: this.calcularFechaExpiracion(),
      ultimoAcceso: new Date(),
      pasoActual: empresa ? 1 : 0, // Si ya tiene empresa, paso 1
      datosParciales: empresa ? { empresa } : {},
      ipOrigen: this.obtenerIP(),
      userAgent: navigator.userAgent
    };
    
    // Guardar en localStorage
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sesion));
    localStorage.setItem(this.ID_KEY, idAcceso);
    
    // Emitir cambios
    this.sesionActual.next(sesion);
    
    console.log(' Nueva sesión creada:', idAcceso);
    return idAcceso;
  }


  // Agregar este método a tu SesionService existente
tienePermiso(permiso: string): boolean {
  //const usuario = this.getUsuarioActual(); // Método que debes implementar
  //const permisos = usuario?.permisos || [];
  
  // En desarrollo, retornar true
  return true;
  
  // En producción:
  // return permisos.includes(permiso) || permisos.includes('admin');
}

  /**
   * Recuperar sesión por ID
   */
  recuperarSesion(idAcceso: string): boolean {
    const sesionGuardada = localStorage.getItem(this.SESSION_KEY);
    
    if (!sesionGuardada) {
      console.log(' No hay sesión guardada');
      return false;
    }
    
    const sesion: SesionAcceso = JSON.parse(sesionGuardada);
    
    // Verificar que el ID coincida
    if (sesion.id !== idAcceso) {
      console.warn(' ID de acceso no coincide');
      return false;
    }
    
    // Verificar si no está expirada
    if (this.sesionExpirada(sesion)) {
      console.warn(' Sesión expirada');
      this.limpiarSesion();
      return false;
    }
    
    // Actualizar último acceso
    sesion.ultimoAcceso = new Date();
    this.guardarSesion(sesion);
    
    // Emitir cambios
    this.sesionActual.next(sesion);
    
    console.log(' Sesión recuperada:', idAcceso);
    return true;
  }

  /**
   * Obtener sesión actual
   */
  getSesionActual(): Observable<any> {
    return this.sesionActual.asObservable();
  }

  getSesionActualValue(): any {
    return this.sesionActual.value;
  }

  /**
   * Actualizar paso actual
   */
  actualizarPaso(paso: number, datos?: any): void {
    const sesion = this.sesionActual.value;
    
    if (sesion) {
      sesion.pasoActual = paso;
      sesion.ultimoAcceso = new Date();
      
      if (datos) {
        sesion.datosParciales = { ...sesion.datosParciales, ...datos };
      }
      
      this.guardarSesion(sesion);
      console.log(`📝 Paso actualizado a ${paso}`);
    }
  }

  /**
   * Obtener ID de acceso actual
   */
  getIdAcceso(): string | null {
    return localStorage.getItem(this.ID_KEY);
  }

  /**
   * Limpiar sesión
   */
  limpiarSesion(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.ID_KEY);
    this.sesionActual.next(null);
    console.log('🧹 Sesión limpiada');
  }

  /**
   * Métodos privados
   */
  private generarIdUnico(): string {
    // Formato: EXM-XXXX-XXXX-XXXX
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `EXM-${timestamp}-${random}`.toUpperCase();
  }

  private calcularFechaExpiracion(): Date {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7); // Expira en 7 días
    return fecha;
  }

  private sesionExpirada(sesion: SesionAcceso): boolean {
    return new Date(sesion.fechaExpiracion) < new Date();
  }

  private guardarSesion(sesion: SesionAcceso): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sesion));
    this.sesionActual.next(sesion);
  }

  private cargarSesionDesdeStorage(): void {
    const sesionGuardada = localStorage.getItem(this.SESSION_KEY);
    if (sesionGuardada) {
      const sesion = JSON.parse(sesionGuardada);
      if (!this.sesionExpirada(sesion)) {
        this.sesionActual.next(sesion);
      } else {
        this.limpiarSesion();
      }
    }
  }

  private obtenerIP(): string {
    // En un entorno real, esto vendría del backend
    return 'IP_NO_DISPONIBLE';
  }
}
