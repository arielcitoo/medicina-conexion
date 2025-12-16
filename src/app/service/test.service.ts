import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  
  // PEGA AQUÍ TU TOKEN JWT que empieza con "eyJ"
  private bearerToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3NjU5MDg3MDksImV4cCI6MTc2NTk0NDcwOSwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2NTkwODcwOSwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjE2MkU0MDY1RjE1QzE3MzNBNDIyNDk4RDA2QjlBMjMwIiwiaWF0IjoxNzY1OTA4NzA5LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.cPJjq0j9OEta1wE7iOcXobkMtrm29OYc2Z43TanRgI-O2ToIjYOihBcfsjrIgoIJphDQX5BcgJtq4RAwRncDRcl6rXTfks-8PNG9DSboWAUGUlsmaJAIRKwJA9wr3a3zo5XmBbVNRVTb5s0LOjiZ557Qm_8N6TWIIl83sWju6kj151uSOWyRI0ST1m1bHtypO4f7q2zKzM_O6DWqLIf64wH0dxuufoUf7rUPOG9l3SOmDZA9mVFCEBQdYnPrB-1wBExvOP9hkrXdfuKdpFNC_Gk8WF_GMnv1UQgW21Qzv_8NJwcizsB5iS2tihA8uOKJwe4V-Nxwk8aX-rz4JkTFUA';
  
  constructor(private http: HttpClient) {
    console.log('🔐 Token JWT cargado:', this.getTokenInfo());
  }

  // Método PRINCIPAL
  getDatosAsegurado() {
    const url = 'https://api-desarrollo.cns.gob.bo/erpcns/v1/Afiliaciones/Asegurados/AseguradoTitular';
    const params = {
      DocumentoIdentidad: '5062677',
      FechaNacimiento: '1988-05-22'
    };
    
    console.log('🌐 Llamando API CNS...');
    console.log('📋 URL:', url);
    console.log('🔑 Token (primeros 50 chars):', this.bearerToken.substring(0, 50) + '...');
    
    return this.http.get(url, {
      params: params,
      headers: this.getHeaders()
    });
  }
  
  // Método para actualizar token
  setToken(newToken: string) {
    this.bearerToken = newToken;
    console.log('🔄 Token actualizado:', this.getTokenInfo());
  }
  
  // Obtener headers con autenticación
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }
  
  // Info del token para debug
  private getTokenInfo(): string {
    if (!this.bearerToken) return 'No hay token';
    
    const parts = this.bearerToken.split('.');
    if (parts.length !== 3) return 'Token JWT inválido';
    
    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      return `JWT válido - Algoritmo: ${header.alg}, Expira: ${new Date(payload.exp * 1000).toLocaleString()}`;
    } catch {
      return `Token JWT (${this.bearerToken.length} chars)`;
    }
  }
}