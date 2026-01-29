import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { SolicitudExamen } from '../../models/admin-citas.interface';

@Component({
  selector: 'app-observar-solicitud-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './observar-citas-dialog.html',
  styleUrls: ['./observar-citas-dialog.css']
})
export class ObservarSolicitudDialog {
  observaciones: string = '';
  solicitud: SolicitudExamen;

  constructor(
    public dialogRef: MatDialogRef<ObservarSolicitudDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.solicitud = data.solicitud;
    if (this.solicitud.observaciones) {
      this.observaciones = this.solicitud.observaciones;
    }
  }

  guardar(): void {
    if (this.observaciones.trim()) {
      this.dialogRef.close(this.observaciones);
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}