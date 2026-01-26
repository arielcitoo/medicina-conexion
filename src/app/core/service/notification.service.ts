// core/services/notification.service.ts
import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  
  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'right',
    verticalPosition: 'top'
  };

  success(message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['snackbar-success']
    });
  }

  error(message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['snackbar-error']
    });
  }

  warning(message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['snackbar-warning']
    });
  }

  info(message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['snackbar-info']
    });
  }
}