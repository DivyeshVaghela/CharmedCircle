import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { AlertController, IonImg, ToastController } from '@ionic/angular';

import { take } from 'rxjs/operators';

import { PostService } from 'src/app/services/post.service';
import { AccountService } from 'src/app/services/account.service';
import { AuthService } from 'src/app/services/auth.service';
import { Post } from 'src/app/models/post.model';
import { ScrollDetail } from '@ionic/core';
import { CommunityArea } from 'src/app/models/community-area.model';
import { LocationService } from 'src/app/services/location.service';
import { CommunityService } from 'src/app/services/community.service';

@Component({
  selector: 'app-post-details',
  templateUrl: './post-details.page.html',
  styleUrls: ['./post-details.page.scss'],
})
export class PostDetailsPage implements OnInit {

  areaId: string;
  communityId: string;
  postId: string;

  post: Post;
  communityArea: CommunityArea;
  community: any;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,

    private postService: PostService,
    private accountService: AccountService,
    private authService: AuthService,
    private locationService: LocationService,
    private communityService: CommunityService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
    this.postId = urlParts[6];

    // this.post = {
    //   areaId: this.areaId,
    //   communityId: this.communityId,
    //   title: 'Learn Guitar',
    //   thumbsUpCount: 0,
    //   uid: '123456',
    //   content: ` Here are 5 steps for learning to play guitar by yourself.
    //   Step 1: Teach Yourself to Tune by Ear.
    //   Step 2: Begin to Build Your Chord Vocabulary.
    //   Step 3: Practice Chords by Playing Songs You Love.
    //   Step 4: Learn the Chromatic Exercise and Use it Daily. `.repeat(10)
    // }
  }

  ngOnInit() {
    
    this.postService.details(this.areaId, this.communityId, this.postId)
      .pipe(take(1))
      .subscribe(async post => {
        this.post = post;
        post.postId = this.postId;

        const users = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], this.post.uid);
        post.user = users[0];

        this.locationService.getCommunityArea(this.post.areaId).pipe(take(1))
          .subscribe(communityArea => this.communityArea = communityArea);

        const communities = await this.communityService.getCommunityFields(this.post.areaId, this.post.communityId, ['name', 'subtitle']);
        this.community = communities[0];
      });
  }

  private img: IonImg;
  @ViewChild(IonImg, { static: false }) set content(content){
    if (content != null){
      this.img = content;
      this.img.ionImgDidLoad.subscribe((event) => {
        this.imgHeight = event.srcElement.scrollHeight;
      });
    }
  }

  makeTransparent = true;
  imgHeight = 80;
  onScroll($event: CustomEvent<ScrollDetail>){
    if ($event && $event.detail && $event.detail.scrollTop){
      this.makeTransparent = $event.detail.scrollTop < (this.imgHeight - 20);
    }
  }

  isThereImageContent(){
    return this.post && this.post.imageUrls && this.post.imageUrls.length > 0;
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
  
  getThubmsUpGuideText(post: Post): string{
    if (!this.authService.isAuthenticated()) return null;
    if (post.uid === this.authService.user$.value.uid)
      return `You can't like your own post`;
    if (post.thumbsUpUids.indexOf(this.authService.user$.value.uid) != -1)
      return 'You already liked this post';
    return null;
  }

  async thumbsUp(){
    const thubmsUpGuideText = this.getThubmsUpGuideText(this.post);
    if (thubmsUpGuideText !== null){
      const toast = await this.toastCtrl.create({
        message: thubmsUpGuideText,
        duration: 3000
      });
      toast.present();
    }

    const canThumbsUp = await this.canThumbsUp(this.post);
    if (!canThumbsUp)
      return;
    const uid = this.authService.user$.value.uid;
    this.postService.thumbsUp(this.post, uid)
      .then(() => {
        this.post.thumbsUpUids.push(uid);
        this.post.thumbsUpCount += 1;
      });
  }

}
