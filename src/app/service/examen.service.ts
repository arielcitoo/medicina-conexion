import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Asegurado } from '../interfaces/examen.interface';

@Injectable({
  providedIn: 'root'
})
export class ExamenService {
  private apiUrl = 'https://api-desarrollo.cns.gob.bo/erpcns/v1';

  constructor(private http: HttpClient) {}

  /**
   * Buscar asegurado por CI y fecha de nacimiento
   */
  buscarAsegurado(ci: string, fechaNacimiento: Date): Observable<any> {
    // Endpoint simulado - ajustar según tu API real
    const body = {
      ci: ci,
      fechaNacimiento: fechaNacimiento.toISOString().split('T')[0]
    };

    const headers = new HttpHeaders({
      'accept': 'application/json',
      'Authorization': 'Bearer TU_TOKEN_AQUI'
    });

    // Simulación de respuesta
    return of({
      success: true,
      data: {
        id: Math.floor(Math.random() * 10000), // ID temporal
        nombreCompleto: 'JUAN PEREZ MAMANI',
        documentoIdentidad: ci,
        correoElectronico: '',
        celular: ''
      }
    }).pipe(delay(1000));

    // Para producción, descomentar:
    // return this.http.post(`${this.apiUrl}/asegurados/buscar`, body, { headers });
  }

  /**
   * Guardar examen preocupacional
   */
  guardarExamen(data: any): Observable<any> {
    // Simulación de guardado
    return of({
      success: true,
      mensaje: 'Examen preocupacional registrado exitosamente',
      id: Math.floor(Math.random() * 1000)
    }).pipe(delay(1500));

    // Para producción:
    // return this.http.post(`${this.apiUrl}/examenes-preocupacionales`, data);
  }
}
