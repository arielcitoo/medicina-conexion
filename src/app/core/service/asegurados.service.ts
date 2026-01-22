import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Asegurado, BusquedaAseguradoResponse } from '../../interface/asegurado.interface';
import { API_CONFIG } from '../../shared/config/api.config';


@Injectable({
  providedIn: 'root'
})
export class AseguradosService extends BaseApiService {

  /**
   * Buscar asegurado titular por documento de identidad y fecha de nacimiento
   */
   buscarAsegurado(documento: string, fechaNacimiento: string): Observable<BusquedaAseguradoResponse> {
    const url = `${this.baseUrl}${API_CONFIG.endpoints.aseguradoTitular}`;
    const params = new HttpParams()
      .set('DocumentoIdentidad', documento)
      .set('FechaNacimiento', fechaNacimiento);

    return this.http.get<any>(url, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapToAseguradoResponse(response))
    );
  }


  /**
   * Mapea la respuesta de la API al formato de la interfaz
   */
    private mapToAseguradoResponse(apiResponse: any): BusquedaAseguradoResponse {
    if (!apiResponse) {
      return {
        success: false,
        message: 'No se encontraron datos del asegurado'
      };
    }

    // Si la API ya devuelve un objeto con la estructura correcta
    if (apiResponse.success !== undefined) {
      return apiResponse as BusquedaAseguradoResponse;
    }

    const asegurado: Asegurado = {
      aseguradoId: apiResponse.aseguradoId || 0,
      matricula: apiResponse.matricula || '',
      estadoAsegurado: apiResponse.estadoAsegurado || '',
      documentoIdentidad: apiResponse.documentoIdentidad || '',
      extencion: apiResponse.extencion || '',
      complemento: apiResponse.complemento || '',
      fechaNacimiento: apiResponse.fechaNacimiento || '',
      paterno: apiResponse.primerApellido || apiResponse.paterno || '',
      materno: apiResponse.segundoApellido || apiResponse.materno || '',
      nombres: apiResponse.nombres || '',
      genero: apiResponse.genero || '',
      tipoAsegurado: apiResponse.tipoAsegurado || '',
      razonSocial: apiResponse.razonSocial || '',
      nroPatronal: apiResponse.nroPatronal || '',
      estadoMora: apiResponse.estadoMora || '',
      grupoFamiliarId: apiResponse.grupoFamiliarId || 0,
      // Campos que pueden no venir de la API, establecer valores por defecto
      correoElectronico: apiResponse.correoElectronico || apiResponse.correo || '',
      celular: apiResponse.celular || apiResponse.telefono || '',
      area: apiResponse.area || apiResponse.departamento || '',
      cargo: apiResponse.cargo || apiResponse.puesto || '',
      fechaIngreso: apiResponse.fechaIngreso || apiResponse.fechaAfiliacion || '',
      empresaId: apiResponse.empresaId || undefined,
      nombreCompleto: this.generarNombreCompleto(apiResponse)
    };

    return {
      success: true,
      data: asegurado,
      message: 'Asegurado encontrado correctamente'
    };
  }

  /**
   * Genera el nombre completo a partir de los componentes
   */
 private generarNombreCompleto(asegurado: any): string {
    const partes = [];
    if (asegurado.nombres) partes.push(asegurado.nombres);
    if (asegurado.primerApellido || asegurado.paterno) partes.push(asegurado.primerApellido || asegurado.paterno);
    if (asegurado.segundoApellido || asegurado.materno) partes.push(asegurado.segundoApellido || asegurado.materno);

    return partes.join(' ');
  }
}
