import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header} from './shared/components/header/header';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
   protected readonly title = signal('medicina-del-trabajo');
   constructor(private router: Router) {}

  ngOnInit(): void {
    // Cambiar título de la página según la ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const route = this.router.routerState.snapshot.root.firstChild;
      const title = route?.data?.['title'] || 'Sistema de Citas Preocupacionales';
      document.title = title;
    });
  }
}
 