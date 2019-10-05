import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UtilService } from '../services/util.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,

    private loadingCtrl: LoadingController,

    private authService: AuthService,
    private utilService: UtilService
  ) {}

  ngOnInit() {}

  async signin(provider: 'google'){

    if (this.utilService.isAuthenticated()){
      this.redirect();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Please wait..',
      spinner: 'crescent'
    });
    loading.present();

    if (provider === 'google'){
      this.authService.googleSignin().then(() => {
        this.utilService.showToast('Signed in succesfully');
        
        this.redirect();
        loading.dismiss();
      }).catch((error) => {
        loading.dismiss();
        if (error.error !== 12501){
          this.utilService.showToast('There was some problem in signing in, please try again');
        }
      });
    } else {
      console.log('Not Supported sign in provider');
      loading.dismiss();
    }
  }

  redirect(){
    let redirectUrl = '/charmed-circle';
    if (this.activatedRoute.snapshot.queryParams.returnUrl){
      redirectUrl = this.activatedRoute.snapshot.queryParams.returnUrl;
    }
    this.router.navigateByUrl(redirectUrl, { replaceUrl:true });
  }
}
