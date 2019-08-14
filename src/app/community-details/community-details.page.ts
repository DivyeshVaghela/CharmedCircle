import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

import { DocumentData } from 'firesql/utils';

import { take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { CommunityService } from '../services/community.service';
import { AccountService } from '../services/account.service';
import { Community } from '../models/community.model';
import { CommunityArea } from '../models/community-area.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-community-details',
  templateUrl: './community-details.page.html',
  styleUrls: ['./community-details.page.scss'],
})
export class CommunityDetailsPage implements OnInit {

  areaId: string = '';
  communityId: string = '';
  community: Community;
  communityArea: CommunityArea;
  members: DocumentData[];

  locationNotMatchAlert: HTMLIonAlertElement;

  constructor(
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,

    private communityService: CommunityService,
    private authService: AuthService,
    private accountService: AccountService,
    private locationService: LocationService
  ) {
    this.extractUrlParams();
  }

  async ngOnInit() {
    this.loadCommunityDetails();
  }

  loadCommunityDetails(){
    this.communityService.getCommunityDetails(this.areaId, this.communityId)
      .pipe(take(1))
      .subscribe((community: Community) => {
        this.community = community;
        this.locationService.getCommunityArea(this.community.areaId)
          .pipe(take(1))
          .subscribe((communityArea: CommunityArea) => this.communityArea = communityArea);
        this.accountService.loadUsers(this.community.members)
          .then(members => this.members = members);
      });
  }

  extractUrlParams(){
    this.activatedRoute.params.subscribe((params: Params) => {
      this.areaId = params.areaId;
      this.communityId = params.communityId;
    });
  }

  isMember(community: Community): boolean{
    if (this.authService.user$.value == null) return false;
    return (community.members && community.members.includes(this.authService.user$.value.uid));
  }

  async leaveCommunity(){
    const leaveCommunityAlert = await this.alertCtrl.create({
      header: 'Leave community confirmation',
      message: `Are you sure you want to leave '${this.community.name}' community?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'primary',
        },
        {
          text: 'Yes',
          cssClass: 'danger',
          handler: () => {
            this.communityService.leaveCommunity({
              areaId: this.community.areaId, 
              communityId: this.community.communityId
            }).then(async () => {

              const successToast = await this.toastCtrl.create({
                message: `You just left the community '${this.community.name}'`,
                duration: 3000
              });
              successToast.present();
              this.location.back();
            }).catch(error => console.log('Community leave error', error));
          }
        }
      ]
    });
    leaveCommunityAlert.present();
  }

  async joinCommunity(){
    if (!this.communityService.canJoinCommunity({ areaId: this.community.areaId })){
      if (this.locationNotMatchAlert == null){
        this.locationNotMatchAlert = await this.alertCtrl.create({
          header: `Locality didn't match`,
          message: 'You cannot join this community because this community is not from your locality. Your current locality is based on your location.',
          buttons: ['OK']
        });
      }
      this.locationNotMatchAlert.present();
      return;
    }

    this.communityService.joinCommunity({ 
      areaId: this.community.areaId, 
      communityId: this.community.communityId, 
      name: this.community.name 
    }).then(async () => {
      // this.community.members.push(this.authService.user$.value.uid);
      // if (this.community.members.length >= 3){
      //   this.community.isPending = false;
      // }
      this.loadCommunityDetails();
      const successToast = await this.toastCtrl.create({
        message: `You joined the community '${this.community.name}'`,
        duration: 3000
      });
      successToast.present();
    }).catch(error => console.log('Community join error', error));
  }
}
