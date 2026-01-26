// core/services/config.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly config = {
    api: {
      baseUrl: environment.apiBaseUrl,
      endpoints: {
        aseguradoTitular: '/Afiliaciones/Asegurados/AseguradoTitular',
        empresasAfiliadas: '/Afiliaciones/EmpresasAfiliadas/Search',
        examenesPreocupacionales: '/examenes-preocupacionales'
      }
    },
    storageKeys: {
      jwtToken: 'jwt_token',
      empresaExamen: 'empresa_examen_preocupacional',
      sesionAcceso: 'examen_sesion_acceso',
      idAcceso: 'examen_id_acceso'
    },
    timeouts: {
      sesion: 7 * 24 * 60 * 60 * 1000, // 7 días
      empresaCache: 60 * 60 * 1000 // 1 hora
    },
    validation: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxAsegurados: 100,
      celularPattern: /^[0-9]{8}$/
    }
  };

  get apiConfig() {
    return this.config.api;
  }

  get storageKeys() {
    return this.config.storageKeys;
  }

  get timeouts() {
    return this.config.timeouts;
  }

  get validation() {
    return this.config.validation;
  }
}