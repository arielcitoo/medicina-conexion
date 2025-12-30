import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SesionService } from '../../../service/sesion.service';
import { AuthService } from '../../../service/empresa.service';
import { Subscription } from 'rxjs';
import { MatIcon } from "@angular/material/icon";
import { TruncatePipe } from "../../../interceptors/truncate.pipe";
import { MatDividerModule } from '@angular/material/divider';


// ✅ Importar módulos Material NECESARIOS
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule ,MatMenuTrigger} from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-header',
  imports: [
    MatDividerModule,
    MatMenuModule,
    MatMenuTrigger,
    CommonModule, 
    RouterModule, 
    MatIcon, 
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TruncatePipe
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  // Propiedades inicializadas
  idAcceso: string | null = null;
  empresa: any = null;
  diasRestantes: number = 0;
  expiraPronto: boolean = false;
  copiado: boolean = false;
  porcentajeProgreso: number = 0;
  
  // Subscripciones inicializadas
  private sesionSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  private copiadoTimeout: any = null;

  constructor(
    private sesionService: SesionService,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 SessionHeader inicializado');
    
    // Obtener ID de acceso inicial
    this.idAcceso = this.sesionService.getIdAcceso();
    
    // Obtener empresa inicial
    this.empresa = this.authService.getEmpresaExamen();
    
    console.log('📋 Estado inicial header:', {
      idAcceso: this.idAcceso,
      empresa: this.empresa?.razonSocial || 'No hay empresa'
    });
    
    // Suscribirse a cambios en la sesión
    this.sesionSubscription = this.sesionService.getSesionActual()
      .subscribe(sesion => {
        console.log('🔄 Cambio en sesión detectado:', sesion?.id);
        if (sesion) {
          this.actualizarEstadoSesion(sesion);
        } else {
          this.idAcceso = null;
          this.empresa = null;
        }
        this.cdRef.detectChanges();
      });
    
    // Suscribirse a cambios en la empresa
    this.authSubscription = this.authService.empresaChanged$
      .subscribe(empresa => {
        console.log('🔄 Cambio en empresa detectado:', empresa?.razonSocial);
        this.empresa = empresa;
        this.cdRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    // Limpiar subscripciones de forma segura
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
    this.porcentajeProgreso = Math.max(0, Math.min(100, (diasTranscurridos / totalDias) * 100));
    
    console.log('📊 Estado sesión actualizado:', {
      diasRestantes: this.diasRestantes,
      expiraPronto: this.expiraPronto,
      porcentajeProgreso: this.porcentajeProgreso
    });
  }

  get mostrarHeader(): boolean {
    const mostrar = !!this.idAcceso;
    console.log('👁️ Mostrar header?', mostrar, 'ID:', this.idAcceso);
    return mostrar;
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

  // Método para truncar texto
  truncarTexto(texto: string, limite: number): string {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
  }

  copiarId(): void {
    if (this.idAcceso) {
      navigator.clipboard.writeText(this.idAcceso).then(() => {
        this.copiado = true;
        this.cdRef.detectChanges();
        
        // Mostrar feedback visual temporal
        if (this.copiadoTimeout) {
          clearTimeout(this.copiadoTimeout);
        }
        
        this.copiadoTimeout = setTimeout(() => {
          this.copiado = false;
          this.cdRef.detectChanges();
        }, 2000);
        
        console.log('📋 ID copiado:', this.idAcceso);
      }).catch(err => {
        console.error('Error al copiar ID:', err);
      });
    }
  }

  verDetalles(): void {
    const detalles = `
ID de Acceso: ${this.idAcceso}
Empresa: ${this.empresa?.razonSocial || 'No especificada'}
Número Patronal: ${this.empresa?.numeroPatronal || this.empresa?.nroPatronal || 'N/A'}
Estado Sesión: ${this.estadoTexto}
Expira en: ${this.diasRestantes} días
    `.trim();
    
    alert(detalles);
  }

  cerrarSesion(): void {
    if (confirm('¿Está seguro de cerrar la sesión? Perderá el ID de acceso.')) {
      this.sesionService.limpiarSesion();
      this.authService.limpiarDatosExamen();
      window.location.href = '/login';
    }
  }
}