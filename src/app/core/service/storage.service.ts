// core/services/storage.service.ts
import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  constructor(private configService: ConfigService) {}

  // Métodos genéricos
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  // Métodos específicos para la aplicación
  setEmpresaExamen(empresa: any): void {
    const empresaData = {
      ...empresa,
      fechaVerificacion: new Date().toISOString()
    };
    this.setItem(this.configService.storageKeys.empresaExamen, empresaData);
  }

  getEmpresaExamen(): any | null {
    const empresa = this.getItem<any>(this.configService.storageKeys.empresaExamen);
    if (!empresa) return null;

    // Verificar expiración
    const fechaVerificacion = new Date(empresa.fechaVerificacion);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fechaVerificacion.getTime();
    
    if (diferencia > this.configService.timeouts.empresaCache) {
      this.removeItem(this.configService.storageKeys.empresaExamen);
      return null;
    }

    return empresa;
  }

  clearExamenData(): void {
    const keys = this.configService.storageKeys;
    this.removeItem(keys.empresaExamen);
    this.removeItem(keys.sesionAcceso);
    this.removeItem(keys.idAcceso);
  }
}