import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ModalController } from '@ionic/angular';

import { take } from 'rxjs/operators';

import { DiscussionService } from 'src/app/services/discussion.service';
import { AccountService } from 'src/app/services/account.service';
import { CommunityService } from 'src/app/services/community.service';
import { Community } from 'src/app/models/community.model';
import { Discussion } from 'src/app/models/discussion.model';
import { QueryConfig } from 'src/app/models/query-config.model';

import { DiscussionFormPage } from '../discussion-form/discussion-form.page';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-discussion-list',
  templateUrl: './discussion-list.page.html',
  styleUrls: ['./discussion-list.page.scss'],
})
export class DiscussionListPage implements OnInit {

  areaId: string;
  communityId: string;
  communityDetails: Community;

  initialLoadFinised = false;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,

    private communityService: CommunityService,
    private discussionService: DiscussionService,
    private accountService: AccountService,
    private utilService: UtilService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
  }

  ngOnInit() {
    this.loadCommunityDetails();
    this.loadDiscussions();
  }

  async loadCommunityDetails(){
    const communities = await this.communityService.getCommunityFields(this.areaId, this.communityId, ['name', 'isPending']);
    this.communityDetails = communities[0];
  }

  ionViewWillEnter(){
    const startIndex = this.router.url.indexOf('?');
    if (startIndex != -1){
      const queryParams = this.router.url.substring(startIndex + 1);
      const params = queryParams.split('&');
      if (params.length > 0 && params[0].split('=')[0] === 'closedDiscussion'){
        this.discussions = [];
        this.queryConfig.after = [];
        this.loadDiscussions();
      }
    }
  }

  discussions: Discussion[] = [];
  queryConfig: QueryConfig = {
    fields: [
      { fieldName: 'isActive', order: 'desc' },
      { fieldName: 'startTimestamp', order: 'desc' }
    ],
    limit: 20,
    after: []
  };

  loadDiscussions($event?){
    this.discussionService.list(this.areaId, this.communityId, this.queryConfig)
      .pipe(take(1))
      .subscribe(discussions => {
        this.discussions = this.discussions.concat(discussions);

        if ($event){
          $event.target.complete();
          if (discussions.length < this.queryConfig.limit)
            $event.target.disabled = true;
        }

        this.initialLoadFinised = true;
        this.discussions.forEach(async discussion => {
          const users = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], discussion.uid);
          discussion.user = users[0];
        })
      });
  }

  loadNextPage($event){
    if (this.discussions.length <= 0) return;

    try{
      const lastDiscussion = this.discussions[this.discussions.length - 1];
      this.queryConfig.after = [lastDiscussion.isActive, lastDiscussion.startTimestamp];
    } catch (error){
      $event.target.complete();
    }
    this.loadDiscussions($event);
  }

  async openNewDiscussionForm(){
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const localityCheck = await this.utilService.checkLocality(this.areaId);
    if (!localityCheck) return;

    const membershipCheck = await this.utilService.checkMemberOfCommunity(this.areaId, this.communityId);
    if (!membershipCheck) return;

    if (this.communityDetails.isPending){
      this.utilService.alertPendingCommunity();
      return;
    }

    const newDiscussionModal = await this.modalCtrl.create({
      component: DiscussionFormPage,
      componentProps: {
        areaId: this.areaId,
        communityId: this.communityId
      }
    });
    newDiscussionModal.present();
    newDiscussionModal.onDidDismiss().then(returnValue => {
      if (returnValue.data.discussionRef && returnValue.data.discussionRef.id){
        this.discussions = [];
        this.queryConfig.after = [];
        this.loadDiscussions();
        const newDiscussionId = returnValue.data.discussionRef.id;
        // this.discussionService.details(this.areaId, this.communityId, newDiscussionId)
        //   .pipe(take(1))
        //   .subscribe(async newDiscussion => {
        //     this.discussions.unshift(newDiscussion);
        //     const users = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], newDiscussion.uid);
        //     newDiscussion.user = users[0];
        //   })
        this.router.navigateByUrl(`/charmed-circle/community/${this.areaId}/${this.communityId}/discussion-list/${newDiscussionId}`);
      }
    });
  }
}
