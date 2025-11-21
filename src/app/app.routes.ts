//app.routes.ts
import { Routes } from '@angular/router';

import { FormUserComponent } from './pages/Forms/user/formUserComponent';
import { FormSettingsComponent } from './pages/Forms/settings/formSettingsComponent';
import { CalendarComponent } from './pages/Forms/calendar/calendar.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { ProductEmpresasDialogComponent } from './components/product-empresas-dialog/product-empresas-dialog.component';
import { ProductosComponent } from './pages/Forms/productos/productos.component';
import { HomeComponent } from './pages/Forms/home/home.component';
import { ScheduleComponent } from './pages/Forms/schedule/schedule.component';
import { EmpresaProductosComponent } from './pages/Forms/empresa-productos/empresa-productos.component';
import { HistoryComponent } from './pages/Forms/history/history.component';

import { AnularCitaComponent } from './pages/Forms/anular-cita/anular-cita.component';
import { EditarCitaComponent } from './pages/Forms/editar-cita/editar-cita.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'form-user', component: FormUserComponent },
      { path: 'form-settings', component: FormSettingsComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'schedule', component: ScheduleComponent },
      {
        path: 'product-empresas-dialog',
        component: ProductEmpresasDialogComponent,
      },
      { path: 'productos', component: ProductosComponent },
      { path: 'empresa/:id/productos', component: EmpresaProductosComponent },
      { path: 'history', component: HistoryComponent },
      {path: 'editar-cita', component: EditarCitaComponent},
      {
        path: 'anular-cita/:id',
        loadComponent: () =>
          import('./pages/Forms//anular-cita/anular-cita.component').then(
            (m) => m.AnularCitaComponent
          ),
      },
    ],
  },
];
