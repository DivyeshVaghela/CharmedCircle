import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import { LocationService } from '../services/location.service';
import { CommunityService } from '../services/community.service';
import { GeneralService } from '../services/general.service';
import { JoinedCommunity } from '../models/user.model';
import { CommunityArea } from '../models/community-area.model';
import { Community } from '../models/community.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  allJoinedCommunities: JoinedCommunity[] = [];
  joinedCommunitiesAreaWise: { communityArea: CommunityArea, communities: JoinedCommunity[] }[] = [];
  localCommunities: Community[] = [];

  tagsPerSlide = 12;

  constructor(
    public authService: AuthService,
    public locationService: LocationService,
    private communityService: CommunityService,
    private accounService: AccountService,
    public generalService: GeneralService
  ) { }
  
  ngOnInit(): void { }

  ionViewWillEnter(){
    this.authService.user$.subscribe(user => {
      if (user != null && user.joinedCommunities){
        this.getJoinedCommunities();
      }
    });

    this.locationService.location$.pipe(take(2)).subscribe(location => {
      if (location != null) this.getLocalCommunities();
    });
  }

  getJoinedCommunities(){
    this.allJoinedCommunities = this.accounService.joinedCommunities();

    this.parseJoinedCommunities();
  }

  parseJoinedCommunities(){
    this.joinedCommunitiesAreaWise = [];
    this.allJoinedCommunities.forEach(joinedCommunity => {
      const found = this.joinedCommunitiesAreaWise.find(c => c.communityArea.areaId == joinedCommunity.areaId);
      if (found){
        found.communities.push(joinedCommunity);
      } else {
        let newCommunityArea: CommunityArea = { areaId: joinedCommunity.areaId, country: null, countryCode: null, state: null, city: null };
        this.joinedCommunitiesAreaWise.push({
          communityArea: newCommunityArea,
          communities: [joinedCommunity]
        });
        this.loadCommunityArea(newCommunityArea);
      }
    });
  }

  getLocalCommunities(){
    this.communityService.getCommunities(this.locationService.getAreaId(), ['areaId', 'communityId', 'name'])
      .then(communities => {
        this.localCommunities = communities;
      })
  }

  loadCommunityArea(communityArea: CommunityArea){
    this.locationService.getCommunityArea(communityArea.areaId)
      .pipe(take(1))
      .subscribe(area => {
        communityArea.countryCode = area.countryCode;
        communityArea.country = area.country;
        communityArea.state = area.state;
        communityArea.city = area.city;
      });
  }

}
