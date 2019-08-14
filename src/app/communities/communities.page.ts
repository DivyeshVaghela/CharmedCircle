import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

import { ModalController, AlertController, ToastController } from '@ionic/angular';

import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { CommunityFormPage } from '../community-form/community-form.page';
import { CommunityService } from '../services/community.service';
import { Location } from '../models/location.model';
import { Community } from '../models/community.model';

@Component({
  selector: 'app-communities',
  templateUrl: './communities.page.html',
  styleUrls: ['./communities.page.scss'],
})
export class CommunitiesPage implements OnInit, OnDestroy {

  communities: Community[];
  currentLocation: Location = null;

  locationNotMatchAlert: HTMLIonAlertElement;

  routeEventSubscription: Subscription;
  previousUrl: string = '';
  private communityDetailsRegEx = new RegExp(/^\/charmed-circle\/communities\/.+\/.+$/);

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,

    private authService: AuthService,
    private locationService: LocationService,
    private communityService: CommunityService
  ) {

    this.locationService.location$.subscribe((location: Location) => {
      this.currentLocation = location;
    });

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
    this.routeEventSubscription = this.router.events.pipe(
      filter(event => {
        return (event instanceof NavigationStart);
      })
    ).subscribe((event: NavigationStart) => {
      if (this.communityDetailsRegEx.test(this.previousUrl))
        this.loadCommunities();
      this.previousUrl = event.url;
    });
    this.loadCommunities();
  }

  loadCommunities(){

    this.communityService.get(this.locationService.getAreaId())
      .pipe(take(1))
      .subscribe(
        response =>  {
          this.communities = response;
        },
        error => console.log('Error fetching the commnities', error)
      );
  }

  isMember(community: Community): boolean{
    if (this.authService.user$.value == null) return false;
    return (community.members && community.members.includes(this.authService.user$.value.uid));
  }

  async openNewCommunityForm(){
    const newCommunityModal = await this.modalCtrl.create({
      component: CommunityFormPage
    });
    await newCommunityModal.present();
    newCommunityModal.onDidDismiss().then(returnValue => {
      if (returnValue.data.refreshContent)
        this.loadCommunities();
    });
  }

  ngOnDestroy(): void {
    if (this.routeEventSubscription != null){
      this.routeEventSubscription.unsubscribe();
      this.routeEventSubscription = null;
    }
  }

  async joinCommunity(community: Community){
    if (!this.communityService.canJoinCommunity({ areaId: community.areaId })){
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
    }).catch(error => console.log('Community join error', error));
  }
}
