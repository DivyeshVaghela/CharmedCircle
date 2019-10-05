import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router, NavigationExtras } from '@angular/router';

import { Network } from '@ionic-native/network/ngx'
import { ErrorCode } from '../models/error-code.model';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {

  constructor(
    private router: Router,
    private platform: Platform,
    private network: Network
  ) {
  }

  isNetworkConnected(redirect: boolean = true): boolean{
    let isConnected = false;
    if (this.platform.is('cordova')){
      isConnected = (this.network.type !== null && this.network.type !== this.network.Connection.NONE);
    } else {
      // For browsers
      isConnected = navigator.onLine;
    }

    if (!isConnected && redirect && this.router.url != "/error"){
      this.router.navigate(['/error',], {
        queryParams: {
          code: ErrorCode.NETWORK_CONNECTION_ERROR,
          returnUrl: this.router.url
        }
      });
    }

    return isConnected;
  }

}
