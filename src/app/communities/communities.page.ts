import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

import { ModalController, AlertController, ToastController } from '@ionic/angular';

import { Subscription } from 'rxjs';
import { filter, take, catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { CommunityFormPage } from '../community-form/community-form.page';
import { CommunityService } from '../services/community.service';
import { Location } from '../models/location.model';
import { Community } from '../models/community.model';
import { UtilService } from '../services/util.service';
import { AccountService } from '../services/account.service';
import { CommunityArea } from '../models/community-area.model';

import { SelectCommunityAreaComponent } from '../select-community-area/select-community-area.component';

@Component({
  selector: 'app-communities',
  templateUrl: './communities.page.html',
  styleUrls: ['./communities.page.scss'],
})
export class CommunitiesPage implements OnInit {

  communities: Community[] = [];

  locationNotMatchAlert: HTMLIonAlertElement;

  initialLoadFinised = false;

  selectedAreaId: string;
  selectedCommunityArea: CommunityArea;
  localitySelection = { 
    useLocation: true,
    countryCode: null,
    state: null,
    locality: null,
  };

  // previousUrl: string = '';
  // private communityDetailsRegEx = new RegExp(/^\/charmed-circle\/communities\/.+\/.+$/);

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,

    private authService: AuthService,
    private accountService: AccountService,
    private locationService: LocationService,
    private communityService: CommunityService,
    private utilService: UtilService
  ) {

    // this.communities = [
    //   {
    //     areaId: 'in-gujarat-rajkot',
    //     communityId: "music",
    //     details: "Music is the Soul of Life. Life and music are two inseparable terms. This community is dedicated to the music lovers of Rajkot.",
    //     isPending: true,
    //     name: "Music",
    //     requester: {
    //       timestamp: 1565433083367,
    //       uid: "JxMm9CfUovTAEW64RbHqdOytUNj1"
    //     },
    //     subtitle: "All about Music",
    //     members: [ 'JxMm9CfUovTAEW64RbHqdOytUNj1' ],
    //     membersCount: 1
    //   }
    // ];
  }

  ngOnInit() {
    // this.loadCommunities();
  }

  ionViewWillEnter(){
    this.loadCommunities();
  }

  async loadCommunities(){

    const gpsOn = await this.locationService.askToTurnOnGPS(false);
    if (!gpsOn){
      this.localitySelection.useLocation = false;
      this.selectLocality();
      return;
    }

    if (this.localitySelection.useLocation == true){
      this.selectedAreaId = this.locationService.getAreaId();
      if (this.selectedAreaId == null){
        this.localitySelection.useLocation = false;
        this.selectLocality();
        return;
      }
    } else {
      this.selectedAreaId = this.locationService.getAreaId({
        countryCode: this.localitySelection.countryCode,
        state: this.localitySelection.state,
        city: this.localitySelection.locality
      });
    }
    
    this.locationService.getCommunityArea(this.selectedAreaId)
      .pipe(take(1))
      .subscribe(communityArea => this.selectedCommunityArea = communityArea);

    this.communityService.get(this.selectedAreaId)
      .pipe(take(1))
      .subscribe(
        response =>  {
          this.communities = response;

          this.initialLoadFinised = true;
        },
        error => console.log('Error fetching the commnities', error)
      );
  }

  isMember(community: Community): boolean{
    if (this.authService.user$.value == null) return false;
    return (community.members && community.members.includes(this.authService.user$.value.uid));
  }

  async openNewCommunityForm(){

    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const localityCheck = await this.utilService.checkLocality(this.selectedAreaId, null, true, `You can't create a community in this locality, because your current location doesn't matched with this locality`);
    if (!localityCheck) return;

    const newCommunityModal = await this.modalCtrl.create({
      component: CommunityFormPage
    });
    await newCommunityModal.present();
    newCommunityModal.onDidDismiss().then(returnValue => {
      if (returnValue.data.refreshContent)
        this.loadCommunities();
    });
  }

  async joinCommunity(community: Community){
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const localityCheck = await this.utilService.checkLocality(community.areaId);
    if (!localityCheck) return;

    this.communityService.joinCommunity({ 
      areaId: community.areaId, 
      communityId: community.communityId, 
      name: community.name 
    }).then(async () => {
      community.members.push(this.authService.user$.value.uid);
      if (community.members.length >= 3){
        community.isPending = false;
      }
      const successToast = await this.toastCtrl.create({
        message: `You joined the community '${community.name}'`,
        duration: 3000
      });
      successToast.present();

      this.accountService.refetchUserDetails();      
    }).catch(error => console.log('Community join error', error));
  }

  async selectLocality(){
    const selectLocalityModal = await this.modalCtrl.create({
      component: SelectCommunityAreaComponent,
      componentProps: {
        localitySelection: this.localitySelection
      }
    });
    selectLocalityModal.present();
    selectLocalityModal.onWillDismiss().then(returnValue => {
      if (returnValue.data && JSON.stringify(this.localitySelection) !== JSON.stringify(returnValue.data)){
        this.localitySelection = returnValue.data;
        this.initialLoadFinised = false;
        this.loadCommunities();
      }
    });
  }
}
