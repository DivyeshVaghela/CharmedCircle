import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { AlertController } from '@ionic/angular';

import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { AuthService } from 'src/app/services/auth.service';
import { LocationService } from 'src/app/services/location.service';
import { AccountService } from 'src/app/services/account.service';
import { CommunityService } from 'src/app/services/community.service';
import { DiscussionService } from 'src/app/services/discussion.service';
import { User } from 'src/app/models/user.model';
import { Community } from 'src/app/models/community.model';
import { Discussion } from 'src/app/models/discussion.model';
import { DiscussionMessage } from 'src/app/models/discussion-message.model';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-discussion',
  templateUrl: './discussion.page.html',
  styleUrls: ['./discussion.page.scss'],
})
export class DiscussionPage implements OnInit, OnDestroy {

  areaId: string;
  communityId: string;
  discussionId: string;

  discussion: Discussion;
  conversationColRef: AngularFirestoreCollection<DiscussionMessage>;
  conversactionSubscription: Subscription;
  conversation: DiscussionMessage[] = [];
  isSending = false;

  communityDetails: Community;
  cachedUserDetails: User[] = [];

  currentUid: string = '';

  userMessage = '';

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private afStore: AngularFirestore,

    private authService: AuthService,
    private accountService: AccountService,
    private locationService: LocationService,
    private communityService: CommunityService,
    private discussionService: DiscussionService,
    private utilService: UtilService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
    this.discussionId = urlParts[6];

    // this.conversation = [
    //   {
    //     message: 'Hi..',
    //     uid: '1',
    //     timestamp: Date.now()
    //   },{
    //     message: 'Hello..\nHow are you?',
    //     uid: '2',
    //     timestamp: Date.now()
    //   },{
    //     message: 'I am fine.. What about you?',
    //     uid: '1',
    //     timestamp: Date.now()
    //   } ,{
    //     message: 'I am also fine..',
    //     uid: '2',
    //     timestamp: Date.now()
    //   },{
    //     message: 'Okay then let us start talk about the actual content..',
    //     uid: '1',
    //     timestamp: Date.now()
    //   },{
    //     message: 'Write, okay..',
    //     uid: '2',
    //     timestamp: Date.now()
    //   },{
    //     message: 'Minim laboris id dolore aliqua pariatur id tempor excepteur.',
    //     uid: '1',
    //     timestamp: Date.now()
    //   },{
    //     message: 'Ex cupidatat consectetur tempor pariatur ea duis nulla aliqua eu in eu magna labore.\n\nNisi magna cupidatat enim qui.',
    //     uid: '1',
    //     timestamp: Date.now()
    //   },{
    //     message: 'Excepteur nostrud ullamco quis exercitation est enim. Amet incididunt occaecat nostrud cupidatat cillum commodo et mollit occaecat nisi qui excepteur magna pariatur. Commodo in nostrud magna reprehenderit cillum tempor fugiat cupidatat eiusmod laborum minim enim voluptate. Reprehenderit eiusmod fugiat fugiat et enim amet elit in et.',
    //     uid: '2',
    //     timestamp: Date.now()
    //   }
    // ];
  }

  async ngOnInit() {
    if (this.authService.isAuthenticated())
      this.currentUid = this.authService.user$.value.uid;
    
    await this.loadCommunityDetails();
    if (this.communityDetails.isPending){
      await this.utilService.alertPendingCommunity();
      this.router.navigateByUrl(`/charmed-circle/community/${this.areaId}/${this.communityId}/discussion-list`);
      return;
    } else if (!await this.utilService.checkMemberOfCommunity(this.areaId, this.communityId)){
      this.router.navigateByUrl(`/charmed-circle/community/${this.areaId}/${this.communityId}/discussion-list`);
      return;
    }
    
    this.loadDiscussionDetails();
    this.loadConversation();
  }

  async loadCommunityDetails(){
    const communities = await this.communityService.getCommunityFields(this.areaId, this.communityId, ['name', 'isPending']);
    this.communityDetails = communities[0];
  }

  loadDiscussionDetails(){
    this.discussionService.details(this.areaId, this.communityId, this.discussionId)
      .pipe(take(1))
      .subscribe(discussion => {
        this.discussion = discussion;
      });
  }

  loadConversation(){
    this.conversationColRef = this.afStore.collection<DiscussionMessage>(
      `/communityAreas/${this.areaId}/communities/${this.communityId}/discussions/${this.discussionId}/conversation`,
      ref => ref.orderBy('timestamp', 'asc'));
    this.conversactionSubscription = this.conversationColRef.valueChanges({ idField: 'messageId' })
      .subscribe(conversation => {
        this.conversation = conversation;
        conversation.forEach(async message => {
          this.loadUserDetail(message);
        });
      }, error => 
        console.log('Conversation fetch error', error)
      );
  }

  async loadUserDetail(message: DiscussionMessage){
    const foundUser = this.getUser(message.uid);
    if (foundUser){
      message.user = foundUser;
    } else {
      const users = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], message.uid);
      message.user = users[0];
      this.cachedUserDetails = this.cachedUserDetails.concat(users);
    }
  }

  getUser(uid: string): User{
    const found = this.cachedUserDetails.find((user: User) => {
      return (uid === user.uid);
    });
    if (found)
      return found;
  }

  async send(){
    if (this.userMessage.trim() === '') return;
    // this.conversation.push({
    //   message: this.userMessage,
    //   uid: '1',
    //   timestamp: Date.now()
    // });
    // this.userMessage = '';

    if (!this.conversationColRef || this.conversationColRef == null) return;

    if (!this.locationService.canTakeAction({areaId: this.areaId})){
      const locationNotMatched = await this.alertCtrl.create({
        header: 'Now allowed',
        message: `You cannot interact within this community, because your current location doesn't match the locality of this community.`,
        buttons: ['OK']
      });
      locationNotMatched.present();
      return;
    }

    const currentLocation = this.locationService.location$.value;

    this.isSending = true;
    const newMessage: DiscussionMessage = {
      areaId: this.areaId, communityId: this.communityId, discussionId: this.discussionId,

      message: this.userMessage,
      uid: this.authService.user$.value.uid,
      
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,

      timestamp: Date.now()
    }
    this.conversationColRef.add(newMessage).then(ref => {
      this.userMessage = '';
      this.isSending = false;
      console.log('New chat message created successfully', ref);
    }, error => {
      this.isSending = false;
      console.log('There was some error in message sending');
    });

    //scroll to bottom
  }

  ngOnDestroy(): void {
    if (this.conversactionSubscription != null){
      this.conversactionSubscription.unsubscribe();
      this.conversactionSubscription = null;
    }
  }

}
