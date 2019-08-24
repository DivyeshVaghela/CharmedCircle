import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UtilService } from './util.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router,

    private utilService: UtilService
  ) { }
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.utilService.checkAuthentication();

    // if (!authCheck) return;  
    // if (this.authService.isAuthenticated()){
    //   return true;
    // }else {
    //   this.router.navigate(['/login'], {
    //     queryParams: {
    //       return: state.url
    //     }
    //   })
    //   return false;
    // }
  }
}
