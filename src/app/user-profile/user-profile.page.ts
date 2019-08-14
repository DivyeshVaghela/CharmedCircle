import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { AccountService } from '../services/account.service';
import { User, JoinedCommunity } from '../models/user.model';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
})
export class UserProfilePage implements OnInit, OnDestroy {

  userProfileSubscription: Subscription;

  uid: string;
  user: User;
  joinedCommunities: any[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private accountService: AccountService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    // this.user = {
    //   uid: 'JxMm9CfUovTAEW64RbHqdOytUNj1',
    //   displayName: 'Divyesh Vaghela',
    //   email: 'divyeshv789@gmail.com',
    //   photoURL: 'https://lh6.googleusercontent.com/-iA_Fo1TblIg/AAAAAAAAAAI/AAAAAAAAABI/dKP8U2LV0Lg/photo.jpg',
    //   lastKnownLocation: {
    //     latitude: 22.2778001,
    //     longitude: 70.7880148,
    //     area: Area.toArea({
    //       latitude: '22.2778001',
    //       longitude: '70.7880148',
    //       countryCode: 'IN',
    //       countryName: 'India',
    //       administrativeArea: 'Gujarat',
    //       subAdministrativeArea: 'Rajkot',
    //       postalCode: 360005,
    //       timestamp: 1565362715751
    //     })
    //   },
    //   joinedCommunities: [
    //     {
    //       areaId: 'in-gujarat-rajkot',
    //       communityId: 'music-station',
    //       name: 'Music Station',
    //       timestamp: 1565539967172,
    //     },
    //     {
    //       areaId: 'in-gujarat-rajkot',
    //       communityId: 'pubg',
    //       name: 'PubG',
    //       timestamp: 1565539968596,
    //     },
    //     {
    //       areaId: 'in-gujarat-porbandar',
    //       communityId: 'pubg',
    //       name: 'PubG Players',
    //       timestamp: 1565539967852,
    //     }
    //   ]
    // };
    // this.parseJoinedCommunities();
    this.activatedRoute.params.subscribe((params: Params) => {
      if (params.uid)
        this.uid = params.uid;
      this.loadUserProfile();
    });
  }

  loadUserProfile(){
    this.userProfileSubscription = this.accountService.getUserProfile(this.uid ? this.uid : null)
      .subscribe(
        user => {
          this.user = user;
          this.uid = this.user.uid;
          this.parseJoinedCommunities();
        },
        error => console.log('User Profile retrieve error', error)
      );
  }

  parseJoinedCommunities(){
    if (this.user.joinedCommunities && this.user.joinedCommunities.length > 0){
      this.joinedCommunities = [];
      this.user.joinedCommunities.forEach((joinedCommunity: JoinedCommunity) => {
        let area = this.joinedCommunities.find(area => {
          if (area.areaId === joinedCommunity.areaId)
            return area;
        });
        if (!area){
          this.joinedCommunities.push({ 
            areaId: joinedCommunity.areaId,
            area$: this.locationService.getCommunityArea(joinedCommunity.areaId).pipe(take(1)),
            communities: [] 
          });
          area = this.joinedCommunities[this.joinedCommunities.length - 1];
        }
        area.communities.push(joinedCommunity);
      });
      this.joinedCommunities.forEach(element => {
        (element.communities as Array<any>).sort((first, second)=>{
          return second.timestamp - first.timestamp;
        });
      });
      console.log(this.joinedCommunities);
    }
  }

  /**
   * check whether the logged in user is seeing own profile
   */
  isOwnProfile(): boolean{
    return (this.authService.isAuthenticated() && this.uid === this.authService.user$.value.uid);
  }

  ngOnDestroy(): void {
    if (this.userProfileSubscription){
      this.userProfileSubscription.unsubscribe();
      this.userProfileSubscription = null;
    }
  }
}
