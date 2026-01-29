import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { AdminCitasService } from '../services/admin-citas.service';
import { SolicitudExamen, Asegurado } from '../models/admin-citas.interface';
import { VerDocumentosDialog } from '../components/ver-documentos-dialog/ver-documentos-dialog';
import { ObservarSolicitudDialog } from '../components/observar-citas-dialog/observar-citas-dialog';
import { ProgramarCitasDialog } from '../components/programar-citas-dialog/programar-citas-dialog';

import { AuthCnsService } from '../../../core/service/auth-cns.service'

@Component({
  selector: 'app-admin-citas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedMaterialModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatCardModule,
    MatExpansionModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  templateUrl: './admin-citas.html',
  styleUrls: ['./admin-citas.css']
})
export class AdminCitas implements OnInit, AfterViewInit {
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly adminCitasService = inject(AdminCitasService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Datos
  dataSource = new MatTableDataSource<SolicitudExamen>([]);
  displayedColumns: string[] = [
    'select',
    'id',
    'asegurado',
    'ci',
    'empresa',
    'estado',
    'fechaRegistro',
    'documentos',
    'acciones'
  ];
  selection = new Set<SolicitudExamen>();

  // Estados
  isLoading = false;
  tieneSesionActiva = false;
  usuarioActual: any = null;

  // Filtros
  estados = [
    { value: 'todos', label: 'Todos los estados', icon: 'all_inbox' },
    { value: 'pendiente', label: 'Pendiente', icon: 'pending_actions' },
    { value: 'observado', label: 'Observado', icon: 'visibility' },
    { value: 'aprobado', label: 'Aprobado', icon: 'check_circle' },
    { value: 'programado', label: 'Programado', icon: 'schedule' },
    { value: 'completado', label: 'Completado', icon: 'done_all' }
  ];

  // Formularios
  filtroForm: FormGroup;

  
  constructor() {
    this.filtroForm = this.fb.group({
      buscar: [''],
      estado: ['todos'],
      fechaDesde: [''],
      fechaHasta: ['']
    });
  }

  ngOnInit(): void {
    this.verificarSesion();
    this.inicializarUsuario();
    this.cargarSolicitudes();
    
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.createFilter();
  }

  // ===== MÉTODOS DE SESIÓN =====

  /**
   * Verificar sesión manualmente (solución temporal)
   */
  private verificarSesion(): void {
    // Verificar localStorage directamente
    const tieneEmpresa = !!localStorage.getItem('empresa_examen_preocupacional');
    const tieneSesion = !!localStorage.getItem('examen_sesion_acceso');
    const tieneIdAcceso = !!localStorage.getItem('examen_id_acceso');
    const tieneToken = !!localStorage.getItem('jwt_token');
    
    this.tieneSesionActiva = tieneEmpresa && tieneSesion && tieneIdAcceso && tieneToken;
    
    if (!this.tieneSesionActiva) {
      this.mostrarError('No tiene una sesión activa. Redirigiendo al inicio...');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
    }
  }

  /**
   * Inicializar datos del usuario
   */
  private inicializarUsuario(): void {
    // Obtener datos del usuario desde localStorage
    const empresaStr = localStorage.getItem('empresa_examen_preocupacional');
    const sesionStr = localStorage.getItem('examen_sesion_acceso');
    const idAcceso = localStorage.getItem('examen_id_acceso');
    
    if (empresaStr && sesionStr && idAcceso) {
      try {
        const empresa = JSON.parse(empresaStr);
        const sesion = JSON.parse(sesionStr);
        
        this.usuarioActual = {
          empresa: empresa,
          sesion: sesion,
          idAcceso: idAcceso,
          nombre: empresa.razonSocial || 'Administrador',
          email: empresa.correoElectronico || 'admin@cns.gov.bo',
          roles: ['admin', 'administrador_citas'],
          permisos: ['ver_citas', 'aprobar_citas', 'programar_citas', 'administrar_citas']
        };
        
        console.log('Usuario inicializado:', this.usuarioActual);
      } catch (error) {
        console.error('Error al parsear datos de usuario:', error);
      }
    }
  }

  /**
   * Verificar permisos de administración
   */
  private verificarPermisos(): boolean {
    // Para desarrollo, asumimos que todos tienen permisos
    // En producción, implementar lógica real de permisos
    if (!this.tieneSesionActiva) {
      return false;
    }
    
    // Verificar roles del usuario
    const tieneRolAdmin = this.usuarioActual?.roles?.includes('admin') || 
                         this.usuarioActual?.roles?.includes('administrador_citas');
    
    if (!tieneRolAdmin) {
      this.mostrarError('No tiene permisos para acceder a esta sección');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
      return false;
    }
    
    return true;
  }

  /**
   * Cerrar sesión del administrador
   */
  cerrarSesion(): void {
    if (confirm('¿Está seguro de cerrar la sesión de administración?')) {
      // Limpiar localStorage
      localStorage.removeItem('empresa_examen_preocupacional');
      localStorage.removeItem('examen_sesion_acceso');
      localStorage.removeItem('examen_id_acceso');
      localStorage.removeItem('jwt_token');
      
      this.tieneSesionActiva = false;
      this.usuarioActual = null;
      this.mostrarMensaje('Sesión cerrada exitosamente');
      
      // Redirigir al home
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500);
    }
  }

  // ===== MÉTODOS DE DATOS =====

  /**
   * Cargar solicitudes desde el servicio
   */
  cargarSolicitudes(): void {
    this.isLoading = true;
    
    // En producción, usar servicio real
    // this.adminCitasService.getSolicitudes().subscribe({
    //   next: (solicitudes) => {
    //     this.dataSource.data = solicitudes;
    //     this.isLoading = false;
    //   },
    //   error: (error) => {
    //     console.error('Error al cargar solicitudes:', error);
    //     this.isLoading = false;
    //     this.mostrarError('Error al cargar las solicitudes');
    //   }
    // });

    // Datos mock para desarrollo
    setTimeout(() => {
      this.dataSource.data = this.adminCitasService.getSolicitudesMock();
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Crear filtro personalizado para la tabla
   */
  createFilter(): (data: SolicitudExamen, filter: string) => boolean {
    return (data, filter) => {
      const searchTerms = JSON.parse(filter);
      
      // Buscar en texto
      const searchText = searchTerms.text?.toLowerCase() || '';
      const matchesSearch = !searchText || 
        this.getNombreAsegurado(data.asegurado).toLowerCase().includes(searchText) ||
        this.getCIAsegurado(data.asegurado).toLowerCase().includes(searchText) ||
        this.getEmpresaAsegurado(data.asegurado).toLowerCase().includes(searchText);

      // Filtrar por estado
      const matchesEstado = searchTerms.estado === 'todos' || data.estado === searchTerms.estado;

      // Filtrar por fecha
      const fechaRegistro = new Date(data.fechaRegistro);
      const matchesFechaDesde = !searchTerms.fechaDesde || fechaRegistro >= new Date(searchTerms.fechaDesde);
      const matchesFechaHasta = !searchTerms.fechaHasta || fechaRegistro <= new Date(searchTerms.fechaHasta);

      return matchesSearch && matchesEstado && matchesFechaDesde && matchesFechaHasta;
    };
  }

  /**
   * Aplicar filtros a la tabla
   */
  aplicarFiltro(): void {
    const filtro = {
      text: this.filtroForm.get('buscar')?.value || '',
      estado: this.filtroForm.get('estado')?.value,
      fechaDesde: this.filtroForm.get('fechaDesde')?.value,
      fechaHasta: this.filtroForm.get('fechaHasta')?.value
    };
    
    this.dataSource.filter = JSON.stringify(filtro);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroForm.reset({
      buscar: '',
      estado: 'todos',
      fechaDesde: '',
      fechaHasta: ''
    });
    this.aplicarFiltro();
  }

  // ===== MÉTODOS DE GESTIÓN DE SOLICITUDES =====

  /**
   * Ver documentos de una solicitud
   */
  verDocumentos(solicitud: SolicitudExamen): void {
    this.dialog.open(VerDocumentosDialog, {
      width: '900px',
      maxHeight: '90vh',
      data: { 
        documentos: solicitud.documentos,
        asegurado: solicitud.asegurado 
      }
    });
  }

  /**
   * Aprobar solicitud
   */
  aprobarSolicitud(solicitud: SolicitudExamen): void {
    if (confirm(`¿Está seguro de aprobar la solicitud de ${this.getNombreAsegurado(solicitud.asegurado)}?`)) {
      this.isLoading = true;
      
      // En producción, usar servicio real
      // this.adminCitasService.aprobarSolicitud(solicitud.id).subscribe({
      //   next: () => {
      //     this.actualizarSolicitudAprobada(solicitud);
      //     this.isLoading = false;
      //   },
      //   error: (error) => {
      //     console.error('Error al aprobar solicitud:', error);
      //     this.mostrarError('Error al aprobar la solicitud');
      //     this.isLoading = false;
      //   }
      // });

      // Mock
      setTimeout(() => {
        this.actualizarSolicitudAprobada(solicitud);
        this.isLoading = false;
      }, 1000);
    }
  }

  /**
   * Actualizar solicitud como aprobada
   */
  private actualizarSolicitudAprobada(solicitud: SolicitudExamen): void {
    solicitud.estado = 'aprobado';
    solicitud.fechaAprobacion = new Date();
    solicitud.observaciones = undefined;
    
    // Enviar email de aprobación
    this.enviarEmailAprobacion(solicitud);
    this.mostrarMensaje('Solicitud aprobada exitosamente');
  }

  /**
   * Observar solicitud
   */
  observarSolicitud(solicitud: SolicitudExamen): void {
    const dialogRef = this.dialog.open(ObservarSolicitudDialog, {
      width: '500px',
      data: { solicitud }
    });

    dialogRef.afterClosed().subscribe(observaciones => {
      if (observaciones) {
        this.isLoading = true;
        
        // En producción, usar servicio real
        // this.adminCitasService.observarSolicitud(solicitud.id, observaciones).subscribe({
        //   next: () => {
        //     solicitud.estado = 'observado';
        //     solicitud.observaciones = observaciones;
        //     this.mostrarMensaje('Observaciones registradas');
        //     this.isLoading = false;
        //   },
        //   error: (error) => {
        //     console.error('Error al observar solicitud:', error);
        //     this.mostrarError('Error al registrar observaciones');
        //     this.isLoading = false;
        //   }
        // });

        // Mock
        setTimeout(() => {
          solicitud.estado = 'observado';
          solicitud.observaciones = observaciones;
          this.mostrarMensaje('Observaciones registradas');
          this.isLoading = false;
        }, 1000);
      }
    });
  }

  /**
   * Rechazar solicitud
   */
  rechazarSolicitud(solicitud: SolicitudExamen): void {
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (motivo) {
      this.isLoading = true;
      
      // Mock
      setTimeout(() => {
        solicitud.estado = 'observado';
        solicitud.observaciones = `Rechazado: ${motivo}`;
        this.mostrarMensaje('Solicitud rechazada');
        this.isLoading = false;
      }, 1000);
    }
  }

  /**
   * Enviar email de aprobación
   */
  enviarEmailAprobacion(solicitud: SolicitudExamen): void {
    console.log('Email de aprobación enviado a:', solicitud.asegurado.correoElectronico);
    this.mostrarMensaje('Email de aprobación enviado');
  }

  /**
   * Programar citas para una solicitud aprobada
   */
  programarCitas(solicitud: SolicitudExamen): void {
    const dialogRef = this.dialog.open(ProgramarCitasDialog, {
      width: '1000px',
      maxHeight: '90vh',
      data: { solicitud }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        solicitud.estado = 'programado';
        solicitud.fechaProgramacion = new Date();
        solicitud.citasProgramadas = result;
        this.mostrarMensaje('Citas programadas exitosamente');
      }
    });
  }

  /**
   * Ver citas programadas
   */
  verCitasProgramadas(solicitud: SolicitudExamen): void {
    if (solicitud.citasProgramadas && solicitud.citasProgramadas.length > 0) {
      const citasInfo = solicitud.citasProgramadas.map(cita => 
        `• ${this.getNombreServicio(cita.servicio)}: ${new Date(cita.fecha).toLocaleDateString()} ${cita.hora}`
      ).join('\n');
      
      alert(`Citas programadas para ${this.getNombreAsegurado(solicitud.asegurado)}:\n\n${citasInfo}`);
    } else {
      this.mostrarMensaje('No hay citas programadas para esta solicitud');
    }
  }

  // ===== MÉTODOS DE DATOS DEL ASEGURADO =====

  /**
   * Obtener nombre completo del asegurado
   */
  getNombreAsegurado(asegurado: Asegurado): string {
    if (asegurado.nombreCompleto) {
      return asegurado.nombreCompleto;
    }
    
    const nombreCompleto = [
      asegurado.paterno,
      asegurado.materno,
      asegurado.nombres
    ].filter(part => part && part.trim()).join(' ');
    
    return nombreCompleto || 'Asegurado';
  }

  /**
   * Obtener CI del asegurado
   */
  getCIAsegurado(asegurado: Asegurado): string {
    const ci = asegurado.documentoIdentidad || '';
    const extension = asegurado.extencion || '';
    
    if (extension) {
      return `${ci} ${extension}`.trim();
    }
    return ci;
  }

  /**
   * Obtener empresa del asegurado
   */
  getEmpresaAsegurado(asegurado: Asegurado): string {
    return asegurado.razonSocial || '';
  }

  /**
   * Obtener nombre del servicio
   */
  getNombreServicio(servicio: string): string {
    switch(servicio) {
      case 'laboratorio': return 'Laboratorio';
      case 'rayos_x': return 'Rayos X';
      case 'evaluacion_medica': return 'Evaluación Médica';
      default: return servicio;
    }
  }

  // ===== MÉTODOS DE UI/HELPERS =====

  /**
   * Obtener icono según estado
   */
  getEstadoIcon(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'pending_actions';
      case 'observado': return 'visibility';
      case 'aprobado': return 'check_circle';
      case 'programado': return 'schedule';
      case 'completado': return 'done_all';
      default: return 'help';
    }
  }

  /**
   * Obtener clase CSS según estado
   */
  getEstadoColor(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'observado': return 'estado-observado';
      case 'aprobado': return 'estado-aprobado';
      case 'programado': return 'estado-programado';
      case 'completado': return 'estado-completado';
      default: return '';
    }
  }

  /**
   * Obtener etiqueta del estado
   */
  getEstadoLabel(estadoValue: string): string {
    const estado = this.estados.find(e => e.value === estadoValue);
    return estado ? estado.label : estadoValue;
  }

  /**
   * Obtener cantidad de documentos pendientes
   */
  getDocumentosPendientesCount(solicitud: SolicitudExamen): number {
    return solicitud.documentos.filter(doc => doc.estado === 'pendiente').length;
  }

  // ===== MÉTODOS DE SELECCIÓN =====

  /**
   * Alternar selección de una fila
   */
  toggleSeleccion(solicitud: SolicitudExamen): void {
    if (this.selection.has(solicitud)) {
      this.selection.delete(solicitud);
    } else {
      this.selection.add(solicitud);
    }
  }

  /**
   * Seleccionar todas las filas
   */
  seleccionarTodos(event: any): void {
    if (event.checked) {
      this.dataSource.filteredData.forEach(row => this.selection.add(row));
    } else {
      this.selection.clear();
    }
  }

  /**
   * Aprobar solicitudes seleccionadas
   */
  aprobarSeleccionados(): void {
    const seleccionados = Array.from(this.selection);
    if (seleccionados.length === 0) {
      this.mostrarError('Seleccione al menos una solicitud');
      return;
    }

    if (confirm(`¿Aprobar ${seleccionados.length} solicitud(es)?`)) {
      seleccionados.forEach(solicitud => {
        solicitud.estado = 'aprobado';
        solicitud.fechaAprobacion = new Date();
        this.enviarEmailAprobacion(solicitud);
      });
      this.mostrarMensaje(`${seleccionados.length} solicitud(es) aprobada(s)`);
      this.selection.clear();
    }
  }

  // ===== MÉTODOS DE EXPORTACIÓN =====

  /**
   * Exportar a Excel
   */
  exportarExcel(): void {
    this.mostrarMensaje('Exportando datos a Excel...');
    // Implementar lógica de exportación
  }

  /**
   * Exportar a PDF
   */
  exportarPDF(): void {
    this.mostrarMensaje('Generando reporte PDF...');
    // Implementar lógica de exportación PDF
  }

  // ===== MÉTODOS GETTER PARA TEMPLATE =====

  get totalSolicitudes(): number {
    return this.dataSource.data.length;
  }

  getSolicitudesPendientesCount(): number {
    return this.dataSource.data.filter(s => s.estado === 'pendiente').length;
  }

  getSolicitudesAprobadasCount(): number {
    return this.dataSource.data.filter(s => s.estado === 'aprobado').length;
  }

  getSolicitudesProgramadasCount(): number {
    return this.dataSource.data.filter(s => s.estado === 'programado').length;
  }

  getSolicitudesCompletadasCount(): number {
    return this.dataSource.data.filter(s => s.estado === 'completado').length;
  }

  get todasSeleccionadas(): boolean {
    return this.selection.size > 0 && 
           this.selection.size === this.dataSource.filteredData.length;
  }

  get seleccionadosParcialmente(): boolean {
    return this.selection.size > 0 && 
           this.selection.size < this.dataSource.filteredData.length;
  }

  getFechaActual(): Date {
    return new Date();
  }

  get fechaActual(): Date {
    return this.getFechaActual();
  }

  // ===== MÉTODOS DE NOTIFICACIÓN =====

  /**
   * Mostrar mensaje de éxito
   */
  mostrarMensaje(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  /**
   * Mostrar mensaje de error
   */
  mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  /**
   * Obtener estadísticas
   */
  getEstadisticas(): any {
    return {
      total: this.totalSolicitudes,
      pendientes: this.getSolicitudesPendientesCount(),
      aprobadas: this.getSolicitudesAprobadasCount(),
      programadas: this.getSolicitudesProgramadasCount(),
      completadas: this.getSolicitudesCompletadasCount()
    };
  }
}