import { Component, NgZone } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.overlaysWebView(true);
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      //check whether the user is authenticated
      this.authService.user$.subscribe((userState) => {
        let destinationUrl = '/login';
        if (userState != null){
          if (this.router.url !== '/login')
            destinationUrl = this.router.url;
          else
          destinationUrl = '/home';
        }
        this.ngZone.run(() => this.router.navigateByUrl(destinationUrl));
      });
    });
  }
}
