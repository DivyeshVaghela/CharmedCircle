import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from './services/auth-guard.service';

const routes: Routes = [
  { path: '', redirectTo: 'landing-check', pathMatch: 'full' },
  { path: 'landing-check', loadChildren: './landing-check/landing-check.module#LandingCheckPageModule' },
  { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
  { path: 'charmed-circle', loadChildren: () => import('./menu/menu.module').then(m => m.MenuPageModule) },
  { path: 'error', loadChildren: './error/error.module#ErrorPageModule' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
