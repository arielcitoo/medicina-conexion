import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ModalPrueba } from '../modal-prueba/modal-prueba';

@Component({
  selector: 'app-citas',
  imports: [CommonModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})
export class Citas {
 constructor(public dialog: MatDialog) {}

  abrirModal(): void {
    this.dialog.open(ModalPrueba, {
      data: { mensaje: '¡Soy un mensaje de prueba!' } // Puedes pasar datos aquí
    });
  }
}