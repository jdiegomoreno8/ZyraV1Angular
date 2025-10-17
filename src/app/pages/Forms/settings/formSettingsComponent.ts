import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory() {
  return new TranslateHttpLoader();
}

@Component({
  selector: 'app-form-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
providers: [
  {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: []
  }
],

  templateUrl: './formSettingsComponent.html',
  styleUrls: ['./formSettingsComponent.css']
})
export class FormSettingsComponent {
  isDarkMode = false;
  selectedLang = 'es';

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('es');
    this.translate.use('es');
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  changeLanguage(lang: string): void {
    this.selectedLang = lang;
    this.translate.use(lang);
  }

  sendEmail() {
    window.location.href = 'mailto:soporte@tudominio.com';
  }

  sendSMS() {
    window.location.href = 'sms:+15703644363';
  }
}
