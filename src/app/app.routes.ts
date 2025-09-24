import { Routes } from '@angular/router';

import { FormUserComponent } from './pages/Forms/user/formUserComponent';
import { FormHistoryComponent } from './pages/Forms/history/formHistoryComponent';
import { FormSettingsComponent } from './pages/Forms/settings/formSettingsComponent';
import { CalendarComponent } from './pages/Forms/calendar/calendar.component';
import { LayoutComponent } from './layout/layout/layout.component';

import { ProductEmpresasDialogComponent } from './components/product-empresas-dialog/product-empresas-dialog.component';
import { ProductosComponent } from './pages/Forms/productos/productos.component';
import { HomeComponent } from './pages/Forms/home/home.component';
import { ScheduleComponent } from './pages/Forms/schedule/schedule.component';
import { EmpresaProductosComponent } from './pages/Forms/empresa-productos/empresa-productos.component';

export const routes: Routes = [

  {
        path: '',
    component: LayoutComponent,
    children: [

    { path: '', component: HomeComponent },
    { path: 'form-user', component: FormUserComponent },
    { path: 'form-history', component: FormHistoryComponent },
    { path: 'form-settings', component: FormSettingsComponent },
    { path: 'calendar', component: CalendarComponent },
    { path: 'schedule', component: ScheduleComponent }, 
    { path: 'product-empresas-dialog', component: ProductEmpresasDialogComponent }, //  Nueva ruta
    { path: 'productos', component: ProductosComponent }, //  Nueva ruta
    {path: 'calendar/:id_empresa', component: CalendarComponent},
    { path: 'empresa/:id/productos', component: EmpresaProductosComponent },


     
    ]
  }
];
