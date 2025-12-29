import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu'; 
import { RouterModule } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SesionService } from '../../../service/sesion.service';
import { AuthService } from '../../../service/empresa.service';
import { Subscription } from 'rxjs';
import { MatIcon } from "@angular/material/icon";
import { TruncatePipe } from "../../../interceptors/truncate.pipe";
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-header',
  imports: [
    MatDividerModule,
    MatMenuModule,
    MatMenuTrigger,
    CommonModule, 
    RouterModule, 
    MatIcon, 
    TruncatePipe
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  idAcceso: string | null = null;
  empresa: any = null;
  diasRestantes: number = 0;
  expiraPronto: boolean = false;
  copiado = false;
  porcentajeProgreso = 0;

    // INICIALIZAR LAS SUBSCRIPCIONES
  private sesionSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  private copiadoTimeout: any = null;

  constructor(
    private sesionService: SesionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener ID de acceso
    this.idAcceso = this.sesionService.getIdAcceso();
    
    // Obtener empresa
    this.empresa = this.authService.getEmpresaExamen();
    
    // Suscribirse a cambios en la sesión
    this.sesionSubscription = this.sesionService.getSesionActual()
      .subscribe(sesion => {
        if (sesion) {
          this.actualizarEstadoSesion(sesion);
        }
      });
    
    // Suscribirse a cambios en la empresa
    this.authSubscription = this.authService.empresaChanged$
      .subscribe(empresa => {
        this.empresa = empresa;
      });
  }

  ngOnDestroy(): void {
    if (this.sesionSubscription) {
      this.sesionSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.copiadoTimeout) {
      clearTimeout(this.copiadoTimeout);
    }
  }

  private actualizarEstadoSesion(sesion: any): void {
    // Calcular días restantes
    const fechaExpiracion = new Date(sesion.fechaExpiracion);
    const ahora = new Date();
    const diffTime = fechaExpiracion.getTime() - ahora.getTime();
    this.diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.expiraPronto = this.diasRestantes <= 1;
    
    // Calcular porcentaje de progreso (7 días total)
    const totalDias = 7;
    const diasTranscurridos = totalDias - this.diasRestantes;
    this.porcentajeProgreso = (diasTranscurridos / totalDias) * 100;
  }

  get mostrarHeader(): boolean {
    return !!this.idAcceso;
  }

  get idAccesoFormateado(): string {
    if (!this.idAcceso) return '';
    // Mostrar solo las primeras y últimas partes
    const parts = this.idAcceso.split('-');
    if (parts.length >= 4) {
      return `${parts[0]}-${parts[1]}...${parts[parts.length - 1]}`;
    }
    return this.idAcceso;
  }

  get estadoIcon(): string {
    if (this.expiraPronto) return 'warning';
    return 'timer';
  }

  get estadoTexto(): string {
    if (this.diasRestantes <= 0) return 'Expirada';
    if (this.diasRestantes <= 1) return 'Expira pronto';
    return 'Activa';
  }

  get mostrarProgreso(): boolean {
    return this.diasRestantes > 0 && this.diasRestantes <= 7;
  }

  copiarId(): void {
    if (this.idAcceso) {
      navigator.clipboard.writeText(this.idAcceso).then(() => {
        this.copiado = true;
        
        // Mostrar feedback visual
        if (this.copiadoTimeout) {
          clearTimeout(this.copiadoTimeout);
        }
        
        this.copiadoTimeout = setTimeout(() => {
          this.copiado = false;
        }, 2000);
        
        console.log('📋 ID copiado al portapapeles:', this.idAcceso);
      });
    }
  }

  verDetalles(): void {
    // Aquí puedes implementar un modal con detalles de la sesión
    console.log('Detalles de sesión:', {
      id: this.idAcceso,
      empresa: this.empresa,
      diasRestantes: this.diasRestantes
    });
    
    // Mostrar alerta temporal
    alert(`ID: ${this.idAcceso}\nEmpresa: ${this.empresa?.razonSocial}\nExpira en: ${this.diasRestantes} días`);
  }

  cerrarSesion(): void {
    if (confirm('¿Está seguro de cerrar la sesión? Perderá el ID de acceso.')) {
      this.sesionService.limpiarSesion();
      this.authService.limpiarDatosExamen();
      window.location.href = '/login';
    }
  }
}