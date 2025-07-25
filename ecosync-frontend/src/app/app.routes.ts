import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { DashboardAddFriendsComponent } from './features/dashboard/dashboard-add-friends/dashboard-add-friends';
import { DashboardConsommationComponent } from './features/dashboard/dashboard-consommation/dashboard-consommation';
import { GenerationsHistoryComponent } from './features/dashboard/dashboard-history/generations-history';
import { DashboardHomeComponent } from './features/dashboard/dashboard-home/dashboard-home';
import { DashboardLayoutComponent } from './features/dashboard/dashboard-layout/dashboard-layout';
import { ImportsComponent } from './features/dashboard/dashboard-imports/imports-component'

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardHomeComponent },
      { path: 'consommation', component: DashboardConsommationComponent },
      { path: 'historique', component: GenerationsHistoryComponent },
      { path: 'import', component: ImportsComponent },
      { path: 'ajouter-amis', component: DashboardAddFriendsComponent },
    ]
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  }
];
