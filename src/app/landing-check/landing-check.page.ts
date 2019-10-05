import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { DiagnosticService } from '../services/diagnostic.service';
import { LocationService } from '../services/location.service';

@Component({
  selector: 'app-landing-check',
  templateUrl: './landing-check.page.html',
  styleUrls: ['./landing-check.page.scss'],
})
export class LandingCheckPage implements OnInit, OnDestroy {

  private subscription: Subscription;
  private counter = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private diagnosticService: DiagnosticService,
    private locationService: LocationService
  ) { }

  ngOnInit() {
  }

  async ionViewWillEnter(){
    const networkConnected = this.diagnosticService.isNetworkConnected();

    if (networkConnected){
      const gpsOn = await this.locationService.askToTurnOnGPS(true);
      if (gpsOn){
        if (this.activatedRoute.snapshot.queryParams.confirmation){
          this.redirect(this.authService.user$.value);
          return;
        }
        this.subscription = this.authService.user$.subscribe(userInfo => {
          this.counter++;
          if (this.counter > 1){
            this.redirect(userInfo);
          }
        });
      }
    }
  }

  redirect(userInfo){
    let replaceUrl = '/charmed-circle';
    if (userInfo == null)
      replaceUrl = '/login';
    this.router.navigateByUrl(replaceUrl, { replaceUrl: true });
  }

  releaseResources(){
    if (this.subscription){
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  ngOnDestroy(): void {
    this.releaseResources();
  }  

}
