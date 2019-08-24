import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-landing-check',
  templateUrl: './landing-check.page.html',
  styleUrls: ['./landing-check.page.scss'],
})
export class LandingCheckPage implements OnInit, OnDestroy {

  private subscription: Subscription;
  private counter = 0;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.subscription = this.authService.user$.subscribe(userInfo => {
      this.counter++;
      if (this.counter > 1){
        this.releaseResources();
        if (userInfo == null){
          this.router.navigateByUrl('/login', { replaceUrl: true });
        } else {
          this.router.navigateByUrl('/charmed-circle', { replaceUrl: true });
        }
      }  
    });
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
