import { Component, NgZone, AfterViewInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

import { timer } from 'rxjs';

import * as $ from 'jquery';

import { Network } from '@ionic-native/network/ngx';
import { AngularFirestore } from '@angular/fire/firestore';
import { DiagnosticService } from './services/diagnostic.service';
import { ErrorCode } from './models/error-code.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements AfterViewInit {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,

    private afStore: AngularFirestore,
    private authService: AuthService,
    private diagnosticService: DiagnosticService,
    
    private router: Router,
    private network: Network,
    private ngZone: NgZone
  ) {
    this.initializeApp();
  }

  showSplash = true;
  orientation = 'portrait';

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.overlaysWebView(true);
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.orientation = (window.innerHeight > window.innerWidth) ? 'portrait' : 'landscape';

      if (!this.diagnosticService.isNetworkConnected(false)){
        this.afStore.firestore.disableNetwork();
      }

      this.network.onConnect()
        .subscribe(value => {
          this.afStore.firestore.enableNetwork();
        });
      this.network.onDisconnect()
        .subscribe(value => {
          this.afStore.firestore.disableNetwork();
          this.ngZone.run(() => {
            this.router.navigate(['/error',], {
              queryParams: {
                code: ErrorCode.NETWORK_CONNECTION_ERROR,
                returnUrl: this.router.url
              }
            });
          });
        });

      timer(3000).subscribe(() => {
        this.showSplash = false

        //check whether the user is authenticated
        // this.authService.user$.subscribe((userState) => {
        //   console.log('userState', userState);
        //   let destinationUrl = '/login';
        //   if (userState != null){
        //     if (this.router.url !== '/login')
        //       destinationUrl = this.router.url;
        //     else
        //     destinationUrl = '/';
        //   }
        //   this.ngZone.run(() => this.router.navigateByUrl(destinationUrl));
        // });
      });
    });
  }

  ngAfterViewInit() {
    // This element never changes.
    let ionapp = document.getElementsByTagName("ion-app")[0];

    window.addEventListener('keyboardDidShow', async (event) => {
      // Move ion-app up, to give room for keyboard
      let kbHeight: number = event["keyboardHeight"];
      let viewportHeight: number = $(window).height();

      if ($(':focus')[0].getBoundingClientRect().bottom < (viewportHeight - kbHeight)){
        return;
      }

      let inputFieldOffsetFromBottomViewPort: number = viewportHeight - $(':focus')[0].getBoundingClientRect().bottom;
      let inputScrollPixels = kbHeight - inputFieldOffsetFromBottomViewPort;

      // Set margin to give space for native keyboard.
      ionapp.style["margin-bottom"] = kbHeight.toString() + "px";

      // But this diminishes ion-content and may hide the input field...
      if (inputScrollPixels > 0) {
        // ...so, get the ionScroll element from ion-content and scroll correspondingly
        // The current ion-content element is always the last. If there are tabs or other hidden ion-content elements, they will go above.
        let ionScroll = await $("ion-content").last()[0].getScrollElement();
        setTimeout(() => {
          $(ionScroll).animate({
            scrollTop: ionScroll.scrollTop + inputScrollPixels
          }, 300);
        }, 300); // Matches scroll animation from css.
      }
    });
    window.addEventListener('keyboardDidHide', () => {
      // Move ion-app down again
      // Scroll not necessary.
      ionapp.style["margin-bottom"] = "0px";
    });
  }
}
