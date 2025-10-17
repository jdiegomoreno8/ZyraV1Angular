//home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  isLoading = false;
  loadingTarget: string | null = null;  // ← Nueva variable

  constructor(private router: Router) {}

  go(path: string) {
    this.isLoading = true;
    this.loadingTarget = path;

    setTimeout(() => {
      this.isLoading = false;
      this.loadingTarget = null;
      this.router.navigate([path]);
    }, 2000);
  }
}
