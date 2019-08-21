import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ModalController, ToastController, AlertController } from '@ionic/angular';

import { DiscussionService } from 'src/app/services/discussion.service';
import { AuthService } from 'src/app/services/auth.service';
import { LocationService } from 'src/app/services/location.service';

@Component({
  selector: 'app-close-discussion-form',
  templateUrl: './close-discussion-form.page.html',
  styleUrls: ['./close-discussion-form.page.scss'],
})
export class CloseDiscussionFormPage implements OnInit {

  @Input() areaId: string;
  @Input() communityId: string;
  @Input() discussionId: string;
  @Input() topic: string;

  closeDiscussionForm: FormGroup;
  isSubmitionInitiated = false;
  discussionClosed = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,

    private authService: AuthService,
    private locationService: LocationService,
    private discussionService: DiscussionService
  ) { }

  ngOnInit() {
    this.createForm();
  }

  createForm(){
    this.closeDiscussionForm = new FormGroup({
      confirmation: new FormControl(false, Validators.requiredTrue),
      aimAchieved: new FormControl(true),
      acknowledgement: new FormControl('', [Validators.required, Validators.minLength(30)])
    });
  }

  async closeDiscussion(){

    this.isSubmitionInitiated = true;
    if (this.closeDiscussionForm.invalid) return;

    if (!this.locationService.canTakeAction({areaId: this.areaId})){
      const locationNotMatched = await this.alertCtrl.create({
        header: 'Now allowed',
        message: `You cannot interact within this community, because your current location doesn't match the locality of this community.`,
        buttons: ['OK']
      });
      locationNotMatched.present();
      return;
    }

    this.closeDiscussionForm.disable();

    this.discussionService.closeDiscussion(this.areaId, this.communityId, this.discussionId, {
      aimAchieved: this.closeDiscussionForm.get('aimAchieved').value,
      acknowledgement: this.closeDiscussionForm.get('acknowledgement').value,
      closedByUid: this.authService.user$.value.uid
    }).then(async () => {
      console.log('Discussion closed successfully');

      const successToast = await this.toastCtrl.create({
        message: `Discussion '${this.topic}' closed successfully`,
        duration: 3000
      });
      successToast.present();
      this.discussionClosed = true;
      this.closeModal();
    }, async error => {
      console.log('Error in closing discussion', error);
      const errorToast = await this.toastCtrl.create({
        message: 'There was some error while closing discussion',
        duration: 3000
      });
      errorToast.present();
      this.closeModal();
    })
  }

  closeModal(){
    this.modalCtrl.dismiss({
      discussionClosed: this.discussionClosed
    });
  }

}
