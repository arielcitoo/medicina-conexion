import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './error-modal.html',
  styleUrl: './error-modal.css',
})
export class ErrorModal {

 constructor(
    public dialogRef: MatDialogRef<ErrorModal>,
    @Inject(MAT_DIALOG_DATA) public data: { mensaje: string }
  ) {}

  onCerrar(): void {
    this.dialogRef.close();
  }

  onReintentar(): void {
    this.dialogRef.close('reintentar');
  }
}
