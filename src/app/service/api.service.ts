import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Configuración - AJUSTA ESTOS VALORES
const API_CONFIG = {
  baseUrl: 'https://api-desarrollo.cns.gob.bo/erpcns',
  version: 'v1',
  // Tu token JWT que funciona
  defaultToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3NjU5MDg3MDksImV4cCI6MTc2NTk0NDcwOSwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2NTkwODcwOSwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjE2MkU0MDY1RjE1QzE3MzNBNDIyNDk4RDA2QjlBMjMwIiwiaWF0IjoxNzY1OTA4NzA5LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.cPJjq0j9OEta1wE7iOcXobkMtrm29OYc2Z43TanRgI-O2ToIjYOihBcfsjrIgoIJphDQX5BcgJtq4RAwRncDRcl6rXTfks-8PNG9DSboWAUGUlsmaJAIRKwJA9wr3a3zo5XmBbVNRVTb5s0LOjiZ557Qm_8N6TWIIl83sWju6kj151uSOWyRI0ST1m1bHtypO4f7q2zKzM_O6DWqLIf64wH0dxuufoUf7rUPOG9l3SOmDZA9mVFCEBQdYnPrB-1wBExvOP9hkrXdfuKdpFNC_Gk8WF_GMnv1UQgW21Qzv_8NJwcizsB5iS2tihA8uOKJwe4V-Nxwk8aX-rz4JkTFUA' // Pega tu token que funciona
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = `${API_CONFIG.baseUrl}/${API_CONFIG.version}`;
  
  constructor(private http: HttpClient) {
    console.log('🌐 API Service inicializado');
    console.log('🔗 Base URL:', this.baseUrl);
  }

  /**
   * CONSULTA PRINCIPAL: Buscar asegurado titular
   */
  buscarAsegurado(documento: string, fechaNacimiento: string): Observable<any> {
    const url = `${this.baseUrl}/Afiliaciones/Asegurados/AseguradoTitular`;
    const params = new HttpParams()
      .set('DocumentoIdentidad', documento)
      .set('FechaNacimiento', fechaNacimiento);
    
    console.log('🔍 Buscando asegurado:', { documento, fechaNacimiento });
    
    return this.http.get(url, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Búsqueda por texto (autocomplete)
   */
  buscarAsegurados(texto: string): Observable<any[]> {
    const url = `${this.baseUrl}/Asegurados`;
    const params = new HttpParams()
      .set('search', texto)
      .set('autocomplete', '1');
    
    return this.http.get<any[]>(url, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener grupo familiar
   */
  getGrupoFamiliar(aseguradoId: number): Observable<any[]> {
    const url = `${this.baseUrl}/Afiliaciones/Asegurados/searchByTitular`;
    const params = new HttpParams().set('aseguradoId', aseguradoId.toString());
    
    return this.http.get<any[]>(url, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener estado de mora
   */
  getEstadoMora(aseguradoId: number): Observable<any[]> {
    const url = `${this.baseUrl}/Afiliaciones/Asegurados/estadoMora/byId`;
    const params = new HttpParams().set('aseguradoId', aseguradoId.toString());
    
    return this.http.get<any[]>(url, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Headers de autenticación
   */
  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${API_CONFIG.defaultToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Actualizar token (si necesitas cambiar dinámicamente)
   */
  setToken(newToken: string) {
    // En una app real, guardarías en localStorage
    console.log('🔄 Token actualizado (primeros 30 chars):', newToken.substring(0, 30) + '...');
  }
}