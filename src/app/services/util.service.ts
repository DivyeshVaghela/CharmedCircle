import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { LocationService } from './location.service';
import { CommunityService } from './community.service';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor(
    private router: Router,

    private alertCtrl: AlertController,
    private toastCtrl: ToastController,

    private authService: AuthService,
    private locationService: LocationService,
    private communityService: CommunityService
  ) { }

  isAuthenticated(){
    return this.authService.isAuthenticated();
  }

  async checkAuthentication(showAlert: boolean = true, redirect: boolean = true): Promise<boolean>{
    if (this.authService.isAuthenticated()) return true;

    if (showAlert){
      const buttons = [];
      if (redirect){
        buttons.push({
          text: 'Sign in now',
          handler: () => {
            if (redirect)
              this.router.navigate(['/login'], {
                queryParams: {
                  returnUrl: this.router.url
                }
              });
          }
        });
      }
      buttons.push( {
        text: redirect ? 'Not now' : 'OK',
        role: 'Cancel'
      });

      const alert = await this.alertCtrl.create({
        header: `Sign in required`,
        message: `You are not signed in. You can't take this action as a guest user.`,
        buttons: buttons
      });
      alert.present();
    }
    return false;
  }

  async checkLocality(areaId: string, location?: { countryCode: string, state: string, city: string }, showAlert: boolean = true): Promise<boolean>{
    if (this.locationService.canTakeAction({ areaId: areaId })) return true;

    if (showAlert)
      this.alertLocationNotMatched();

    return false;
  }

  async alertLocationNotMatched(message?: string){
    const locationNotMatched = await this.alertCtrl.create({
      header: 'Locality not matched',
      message: message ? message : `You cannot interact within this community, because your current location doesn't match the locality of this community.`,
      buttons: ['OK']
    });
    locationNotMatched.present();
  }
  
  async checkMemberOfCommunity(areaId: string, communityId: string, uid?: string, showAlert: boolean = true, message?: string): Promise<boolean>{
    const isMember = this.communityService.isMember(areaId, communityId, uid);

    if (isMember) return true;

    if (showAlert)
      this.alertNotMember(areaId, communityId, message);

    return false;
  }

  async alertNotMember(areaId: string, communityId: string, message?: string){
    const locationNotMatched = await this.alertCtrl.create({
      header: 'Not a member',
      message: message ? message : `You cannot take actions because, you are not a member of this community`,
      buttons: [
        {
          text: 'Join Now',
          handler: () => {
            this.router.navigateByUrl(`/charmed-circle/communities/${areaId}/${communityId}`, {
              queryParams: {
                returnUrl: this.router.url
              }
            });
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    locationNotMatched.present();
  }

  async alertPendingCommunity(message?: string){
    const pendingCommunityAlert = await this.alertCtrl.create({
      header: 'Community is pending',
      message: message ? message : `This community is still pending because there are not enough members.`,
      buttons: ['OK']
    });
    pendingCommunityAlert.present();
  }

  async showToast(message: string, duration: number = 3000){
    const toast = await this.toastCtrl.create({
      message,
      duration
    });
    toast.present();
  }
}
