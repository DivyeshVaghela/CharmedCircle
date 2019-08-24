import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ModalController, AlertController, ToastController } from '@ionic/angular';

import { take } from 'rxjs/operators';

import { PostFormPage } from '../post-form/post-form.page';
import { PostService, QueryConfig } from '../../services/post.service';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { Post } from '../../models/post.model';
import { CommunityService } from 'src/app/services/community.service';
import { Community } from 'src/app/models/community.model';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.page.html',
  styleUrls: ['./post-list.page.scss'],
})
export class PostListPage implements OnInit {

  areaId: string;
  communityId: string;
  communityDetails: Community;

  initialLoadFinised = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,

    private authService: AuthService,
    private accountService: AccountService,
    private locationService: LocationService,
    private postService: PostService,
    private communityService: CommunityService,
    private utilService: UtilService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
  }

  ngOnInit() {
    this.loadCommunityDetails();
  }

  ionViewWillEnter(){
    this.initQueryConfig();
    this.loadPosts();    
  }

  async loadCommunityDetails(){
    const communities = await this.communityService.getCommunityFields(this.areaId, this.communityId, ['name', 'isPending']);
    this.communityDetails = communities[0];
  }

  posts: Post[] = [];
  queryConfig: QueryConfig = {
    field: 'timestamp',
    reverse: true,
    limit: 20,
    after: null
  };

  initQueryConfig(){
    this.posts = [];
    this.queryConfig.after = null;
    this.initialLoadFinised = false;
  }

  loadPosts($event?, prepend?: boolean){

    this.postService.list(this.areaId, this.communityId, this.queryConfig)
      .pipe(take(1))
      .subscribe(posts => {

        if (prepend){
          this.posts = posts.concat(this.posts);
          $event.target.complete();
        } else {
          this.posts = this.posts.concat(posts);
          if ($event){
            $event.target.complete();
            if (posts.length < this.queryConfig.limit)
              $event.target.disabled = true;
          }
        }
        this.initialLoadFinised = true;

        posts.forEach(async post => {
          post.user = await this.getUserInfo(post.uid);
        });
      });
  }

  loadNextPage($event){
    this.queryConfig.reverse = true;
    try{
      this.queryConfig.after = this.posts[this.posts.length - 1].timestamp;
    } catch (error){
      $event.target.complete();
    }
    this.loadPosts($event);
  }

  loadLatestPosts($event){
    this.queryConfig.reverse = false;
    this.queryConfig.after = this.posts[0].timestamp;
    this.loadPosts($event, true);
  }
  
  async getUserInfo(uid: string){
    const users = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], uid);
    return users[0];
  }

  async canThumbsUp(post: Post): Promise<boolean>{
    const result = await this.postService.canThumbsUp(post)
    if (result.result) return true;

    switch(result.reason){
      case 'Location not matched':
        this.utilService.alertLocationNotMatched();
        break;
      
      case 'Already thumbsUp':
        this.utilService.showToast('You already liked this post');
        break;
      
      case 'Own post':
        this.utilService.showToast(`You can't like your own post`);
        break;
    }
    return false;
  }

  async thumbsUp(post: Post){
    
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const membershipCheck = await this.utilService.checkMemberOfCommunity(this.areaId, this.communityId);
    if (!membershipCheck) return;

    if (this.communityDetails.isPending){
      this.utilService.alertPendingCommunity();
      return;
    }
    
    const canThumbsUp = await this.canThumbsUp(post);
    if (!canThumbsUp)
      return;

    const uid = this.authService.user$.value.uid;
    this.postService.thumbsUp(post, uid)
      .then(() => {
        post.thumbsUpUids.push(uid);
        post.thumbsUpCount += 1;
      });
  }

  async openNewPostForm(){

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

    const newPostFormModal = await this.modalCtrl.create({
      component: PostFormPage,
      componentProps: {
        'areaId': this.areaId,
        'communityId': this.communityId 
      }
    });
    await newPostFormModal.present();
    newPostFormModal.onDidDismiss().then(returnValue => {
      if (returnValue.data.refreshContent){
        this.initQueryConfig();
        this.loadPosts();
      }
    })
  }
}
