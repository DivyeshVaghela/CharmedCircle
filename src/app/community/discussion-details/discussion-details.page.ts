import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ModalController } from '@ionic/angular';

import { take } from 'rxjs/operators';

import { AccountService } from 'src/app/services/account.service';
import { LocationService } from 'src/app/services/location.service';
import { CommunityService } from 'src/app/services/community.service';
import { DiscussionService } from 'src/app/services/discussion.service';
import { CommunityArea } from 'src/app/models/community-area.model';
import { User } from 'src/app/models/user.model';
import { Discussion } from 'src/app/models/discussion.model';

import { CloseDiscussionFormPage } from '../close-discussion-form/close-discussion-form.page';
import { AuthService } from 'src/app/services/auth.service';
import { Community } from 'src/app/models/community.model';

@Component({
  selector: 'app-discussion-details',
  templateUrl: './discussion-details.page.html',
  styleUrls: ['./discussion-details.page.scss'],
})
export class DiscussionDetailsPage implements OnInit {

  areaId: string;
  communityId: string;
  discussionId: string;

  discussion: Discussion;
  communityArea: CommunityArea;
  communityDetails: Community;
  closedByUser: User;
  discussionClosed = false;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,

    private authService: AuthService,
    private accountService: AccountService,
    private locationService: LocationService,
    private communityService: CommunityService,
    private discussionService: DiscussionService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
    this.discussionId = urlParts[6];
  }

  ngOnInit() {
    this.loadDiscussionDetails();
  }

  loadDiscussionDetails(){
    this.discussionService.details(this.areaId, this.communityId, this.discussionId)
      .pipe(take(1))
      .subscribe(async discussion => {
        this.discussion = discussion;

        const users = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], discussion.uid);
        if (users.length > 0)
          discussion.user = users[0];

        if (!discussion.isActive){
          const usersClosed = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], discussion.closedByUid);
          if (usersClosed.length > 0)
            this.closedByUser = usersClosed[0];
        }

        this.locationService.getCommunityArea(discussion.areaId).pipe(take(1))
          .subscribe(communityArea => this.communityArea = communityArea);

        const communities = await this.communityService.getCommunityFields(discussion.areaId, discussion.communityId, ['name', 'subtitle', 'isPending']);
        this.communityDetails = communities[0];
      });
  }

  async closeDiscussion(){

    const closeDiscussionModal = await this.modalCtrl.create({
      component: CloseDiscussionFormPage,
      componentProps: {
        areaId: this.areaId,
        communityId: this.communityId,
        discussionId: this.discussionId,
        topic: this.discussion.topic
      }
    });
    closeDiscussionModal.present();
    closeDiscussionModal.onDidDismiss().then(returnValue => {
      if (returnValue.data.discussionClosed){
        this.discussionClosed = returnValue.data.discussionClosed;
        if (returnValue.data.discussionClosed === true)
          this.loadDiscussionDetails();
      }
    });
  }

}
