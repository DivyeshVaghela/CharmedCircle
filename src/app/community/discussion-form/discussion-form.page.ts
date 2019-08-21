import { Component, OnInit, Input } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LocationService } from 'src/app/services/location.service';
import { Discussion } from 'src/app/models/discussion.model';
import { AuthService } from 'src/app/services/auth.service';
import { DiscussionService } from 'src/app/services/discussion.service';
import { DiscussionMessage } from 'src/app/models/discussion-message.model';
import { DocumentReference } from '@angular/fire/firestore';

@Component({
  selector: 'app-discussion-form',
  templateUrl: './discussion-form.page.html',
  styleUrls: ['./discussion-form.page.scss'],
})
export class DiscussionFormPage implements OnInit {

  @Input() areaId: string;
  @Input() communityId: string;

  discussionForm: FormGroup;
  isSubmitionInitiated = false;

  discussionRef: DocumentReference = null;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,

    private authService: AuthService,
    private locationService: LocationService,
    private discussionService: DiscussionService
  ) { }

  ngOnInit() {
    this.createForm();
  }

  createForm(){
    this.discussionForm = new FormGroup({
      topic: new FormControl('', Validators.required),
      details: new FormControl('', [Validators.required, Validators.minLength(30)])
    });
  }

  async createDiscussion(){

    this.isSubmitionInitiated = true;
    if (this.discussionForm.invalid) return;

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
    this.discussionForm.disable();
    
    const newDiscussion: Discussion = {
      areaId: this.areaId,
      communityId: this.communityId,

      topic: this.discussionForm.get('topic').value,
      details: this.discussionForm.get('details').value,
      isActive: true,
      uid: this.authService.user$.value.uid,

      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    };
    try {
      this.discussionRef = await this.discussionService.create(newDiscussion);
      
      const firstMessage: DiscussionMessage = {
        areaId: this.areaId, communityId: this.communityId, discussionId: this.discussionRef.id,
  
        message: newDiscussion.details,
        uid: this.authService.user$.value.uid,
        
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
  
        timestamp: Date.now()
      }

      await this.discussionService.sendMessage(firstMessage);

      const successToast = await this.toastCtrl.create({
        message: 'New discussion started successfully',
        duration: 3000
      });
      successToast.present();
      this.closeModal();

    } catch (error){
      console.log('Error while creating a new post', error);
      const errorToast = await this.toastCtrl.create({
        message: 'There was some error while starting a new discussion',
        duration: 3000
      });
      errorToast.present();
      this.closeModal();
    }
  }

  closeModal(){
    this.modalCtrl.dismiss({
      discussionRef: this.discussionRef
    });
  }

}
