import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ModalController, AlertController } from '@ionic/angular';

import { take } from 'rxjs/operators';

import { PostFormPage } from '../post-form/post-form.page';
import { PostService, QueryConfig } from '../../services/post.service';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.page.html',
  styleUrls: ['./post-list.page.scss'],
})
export class PostListPage implements OnInit {

  areaId: string;
  communityId: string;
  initialLoadFinised = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,

    private postService: PostService,
    private accountService: AccountService,
    private authService: AuthService,
    private locationService: LocationService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
  }

  ngOnInit() {
    this.loadPosts();
  }

  posts: Post[] = [];
  queryConfig: QueryConfig = {
    field: 'timestamp',
    reverse: true,
    limit: 20,
    after: null
  };

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
    this.queryConfig.after = this.posts[this.posts.length - 1].timestamp;
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
    if (!result.result){
      if (result.reason == 'Location not matched'){
        const locationNotMatched = await this.alertCtrl.create({
          header: 'Now allowed',
          message: `You cannot interact within this community, because your current location doesn't match the locality of this community.`,
          buttons: ['OK']
        });
        locationNotMatched.present();
      }
      return false;
    }

    return true;
  }

  async thumbsUp(post: Post){
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
    const newPostFormModal = await this.modalCtrl.create({
      component: PostFormPage,
      componentProps: {
        'areaId': this.areaId,
        'communityId': this.communityId 
      }
    });
    await newPostFormModal.present();
    newPostFormModal.onDidDismiss().then(returnValue => {
      if (returnValue.data.refreshContent)
        this.loadPosts();
    })
  }
}
