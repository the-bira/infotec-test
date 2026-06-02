import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { VehiclesList } from './pages/vehicles-list/vehicles-list';
import { VehicleForm } from './pages/vehicle-form/vehicle-form';
import { Settings } from './pages/settings/settings';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'vehicles', 
    component: VehiclesList, 
    canActivate: [authGuard] 
  },
  { 
    path: 'vehicles/new', 
    component: VehicleForm, 
    canActivate: [authGuard] 
  },
  { 
    path: 'vehicles/edit/:id', 
    component: VehicleForm, 
    canActivate: [authGuard] 
  },
  { 
    path: 'settings', 
    component: Settings, 
    canActivate: [authGuard] 
  }
];
